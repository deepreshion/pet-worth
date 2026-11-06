import { deleteMedicalEvent, saveMedicalEvent } from "./medicalEvents";

jest.mock("@/platform/files", () => ({
  readUpload: jest.fn(async () => new ArrayBuffer(3)),
}));

const mockServices = {
  upload: jest.fn(),
  remove: jest.fn(),
  rpc: jest.fn(),
  rpcSingle: jest.fn(),
  attachmentMaybeSingle: jest.fn(),
  eventMaybeSingle: jest.fn(),
  schedule: jest.fn(),
  cancel: jest.fn(),
};
jest.mock("@/services/profile", () => ({
  getCurrentProfile: () =>
    Promise.resolve({
      id: "u",
      email: "u@test",
      displayName: null,
      timezone: "UTC",
    }),
}));
jest.mock("@/services/notifications", () => ({
  scheduleEventNotification: (...args: unknown[]) =>
    mockServices.schedule(...args),
  cancelEventNotification: (...args: unknown[]) => mockServices.cancel(...args),
}));
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "pets")
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    family_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
                    name: "Сеня",
                  },
                  error: null,
                }),
            }),
          }),
        };
      if (table === "medical_attachments")
        return {
          select: () => ({
            eq: () => ({ maybeSingle: mockServices.attachmentMaybeSingle }),
          }),
        };
      if (table === "medical_events")
        return {
          select: () => ({
            eq: () => ({ maybeSingle: mockServices.eventMaybeSingle }),
          }),
        };
      if (table === "storage_cleanup_outbox")
        return {
          select: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      throw new Error(`Unexpected table ${table}`);
    },
    storage: {
      from: () => ({
        upload: mockServices.upload,
        remove: mockServices.remove,
      }),
    },
    rpc: (...args: unknown[]) => mockServices.rpc(...args),
  },
}));

const input = {
  petId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  type: "analysis" as const,
  title: "Анализ",
  eventDate: "2099-01-03",
  reminderEnabled: false,
  files: [
    {
      uri: "file:///result.pdf",
      name: "result.pdf",
      mimeType: "application/pdf",
      size: 3,
    },
  ],
  retainedAttachmentIds: [],
};

describe("atomic medical event workflows", () => {
  beforeEach(() => {
    mockServices.upload.mockReset().mockResolvedValue({ error: null });
    mockServices.remove.mockReset().mockResolvedValue({ error: null });
    mockServices.rpcSingle.mockReset();
    mockServices.rpc
      .mockReset()
      .mockImplementation(() => ({ single: mockServices.rpcSingle }));
    mockServices.attachmentMaybeSingle
      .mockReset()
      .mockResolvedValue({ data: null, error: null });
    mockServices.eventMaybeSingle
      .mockReset()
      .mockResolvedValue({ data: null, error: null });
    mockServices.schedule
      .mockReset()
      .mockResolvedValue({ scheduled: false, denied: false });
    mockServices.cancel.mockReset().mockResolvedValue(undefined);
  });

  it("removes uploads after an explicit transactional database rejection", async () => {
    mockServices.rpcSingle.mockResolvedValue({
      data: null,
      error: Object.assign(new Error("db failed"), { code: "22023" }),
    });
    await expect(saveMedicalEvent(input)).rejects.toThrow("db failed");
    expect(mockServices.remove).toHaveBeenCalledTimes(1);
    expect(mockServices.remove.mock.calls[0][0]).toHaveLength(1);
  });

  it("does not rely on response paths for physical cleanup", async () => {
    mockServices.rpcSingle.mockResolvedValue({
      data: {
        event_id: input.requestId,
        removed_storage_paths: ["old/path.pdf"],
        reminder_notification_id: null,
        reminder_scheduled_at: null,
      },
      error: null,
    });
    await expect(saveMedicalEvent(input)).resolves.toMatchObject({
      cleanupWarnings: [],
    });
    expect(mockServices.remove).not.toHaveBeenCalled();
  });

  it("never rolls back committed attachment objects when notification scheduling fails", async () => {
    mockServices.rpcSingle.mockResolvedValue({
      data: {
        event_id: input.requestId,
        removed_storage_paths: [],
        reminder_notification_id: 42,
        reminder_scheduled_at: "2099-01-02T10:00:00Z",
      },
      error: null,
    });
    mockServices.schedule.mockRejectedValue(new Error("native failed"));
    const result = await saveMedicalEvent({
      ...input,
      reminderEnabled: true,
      eventTime: "10:00",
    });
    expect(result.cleanupWarnings).toContain("NOTIFICATION_SCHEDULE_FAILED");
    expect(mockServices.remove).not.toHaveBeenCalled();
  });

  it("commits and verifies deletion before best-effort physical cleanup", async () => {
    mockServices.rpcSingle.mockResolvedValue({
      data: {
        removed_storage_paths: ["old/path.pdf"],
        reminder_notification_id: 42,
      },
      error: null,
    });
    await deleteMedicalEvent("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee");
    expect(mockServices.rpcSingle.mock.invocationCallOrder[0]).toBeLessThan(
      mockServices.eventMaybeSingle.mock.invocationCallOrder[0],
    );
    expect(mockServices.cancel).toHaveBeenCalledWith(42);
  });

  it("does not touch files when the delete RPC is denied", async () => {
    mockServices.rpcSingle.mockResolvedValue({
      data: null,
      error: new Error("denied"),
    });
    await expect(
      deleteMedicalEvent("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"),
    ).rejects.toThrow("denied");
    expect(mockServices.remove).not.toHaveBeenCalled();
    expect(mockServices.cancel).not.toHaveBeenCalled();
  });

  it("keeps the committed deletion successful when physical cleanup fails", async () => {
    mockServices.rpcSingle.mockResolvedValue({
      data: {
        removed_storage_paths: ["old/path.pdf"],
        reminder_notification_id: null,
      },
      error: null,
    });
    mockServices.remove.mockResolvedValue({
      error: new Error("storage unavailable"),
    });
    await expect(
      deleteMedicalEvent("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"),
    ).resolves.toEqual({ cleanupWarnings: [] });
  });

  it("accepts an idempotent retry after a lost RPC response without deleting accepted uploads", async () => {
    mockServices.rpcSingle
      .mockResolvedValueOnce({ data: null, error: new Error("network lost") })
      .mockResolvedValueOnce({
        data: {
          event_id: input.requestId,
          reminder_notification_id: null,
          reminder_scheduled_at: null,
        },
        error: null,
      });
    await expect(saveMedicalEvent(input)).resolves.toMatchObject({
      eventId: input.requestId,
    });
    expect(mockServices.remove).not.toHaveBeenCalled();
    expect(mockServices.rpcSingle).toHaveBeenCalledTimes(2);
    expect(mockServices.rpc).toHaveBeenCalledTimes(2);
    expect(mockServices.rpc.mock.calls[1]).toEqual(
      mockServices.rpc.mock.calls[0],
    );
  });

  it("does not falsely accept an unchanged existing event after a lost update response", async () => {
    mockServices.rpcSingle.mockResolvedValue({
      data: null,
      error: new Error("network lost"),
    });
    const update = {
      ...input,
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      requestId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      title: "Новое название",
      files: [],
    };
    await expect(saveMedicalEvent(update)).rejects.toThrow("network lost");
    expect(mockServices.rpcSingle).toHaveBeenCalledTimes(2);
    expect(mockServices.remove).not.toHaveBeenCalled();
  });
});
