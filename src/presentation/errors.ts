import { t, type MessageKey } from "@/i18n";
export const errorMessages: Record<string, MessageKey> = {
  AUTH_NETWORK:
    "Не удалось подключиться к серверу входа. Проверьте подключение к интернету. Если ошибка повторяется, обратитесь к разработчику.",
  AUTH_SEND_FAILED: "Не удалось отправить код для входа. Попробуйте ещё раз.",
  AUTH_RATE_LIMIT:
    "Слишком много запросов на вход. Подождите несколько минут и повторите попытку.",
  AUTH_EMAIL_RESTRICTED:
    "Отправка писем на этот адрес ограничена настройками сервера. Обратитесь к разработчику.",
  AUTH_CONFIGURATION:
    "Вход недоступен из-за настроек сервера. Обратитесь к разработчику.",
  AUTH_UNAVAILABLE: "Сервер входа временно недоступен. Попробуйте позже.",

  AUTH_OTP_FORMAT: "Введите 6 цифр из письма",
  AUTH_OTP_INVALID:
    "Код неверный или истёк. Попробуйте ещё раз или запросите новый.",
  AUTH_VERIFY_FAILED: "Не удалось проверить код. Попробуйте ещё раз.",
  TITLE_REQUIRED: "Укажите название",
  EMAIL_INVALID: "Укажите корректный email.",
  AUTH_CALLBACK: "Ссылка недействительна или истекла. Запросите новую.",
  INVALID_FILE_TYPE: "Можно прикрепить JPG, PNG, WebP, HEIC/HEIF или PDF.",
  INVALID_FILE_SIZE: "Размер каждого файла должен быть не больше 20 МБ.",
  PHOTO_PERMISSION: "Не удалось открыть фото.",
  FILE_LINK: "Не удалось создать ссылку на файл",
  SHARING_UNAVAILABLE: "Не удалось скачать файл",
  STORAGE_CLEANUP_READ_FAILED: "Не удалось проверить очередь очистки вложений.",
  STORAGE_DELETE_FAILED: "Не удалось очистить некоторые файлы из хранилища.",
  STORAGE_CLEANUP_ACK_FAILED:
    "Не удалось очистить некоторые файлы из хранилища.",
  AUTH_REQUIRED: "Требуется вход",
  PET_UNKNOWN: "Питомец",
  STORAGE_CLEANUP_FAILED: "Не удалось очистить некоторые файлы из хранилища.",
  REMINDER_TOO_SOON:
    "Напоминание можно включить только минимум за 24 часа до события.",
  EVENT_SAVE_UNCONFIRMED: "Сохранение события не подтверждено",
  NOTIFICATION_SCHEDULE_FAILED:
    "Событие сохранено, но локальное уведомление не удалось запланировать.",
  NOTIFICATION_CANCEL_FAILED:
    "Событие сохранено, но старое локальное уведомление не удалось отменить.",
  EVENT_DELETE_UNCONFIRMED: "Удаление события не подтверждено",
  EVENT_DELETE_NOT_APPLIED: "Событие не было удалено",
  PET_SAVE_FAILED:
    "Не удалось сохранить питомца. Проверьте интернет и попробуйте ещё раз.",
  PET_CREATE_FAILED: "Питомец не был создан",
  PET_UPDATE_FAILED: "Питомец не был обновлён",
  USER_NOT_FOUND: "Пользователь не найден",
  NUMBER_INVALID: "Укажите число",
  NAME_REQUIRED: "Укажите имя",
  NAME_TOO_LONG: "Не больше 80 символов",
  SPECIES_REQUIRED: "Выберите вид",
  BREED_TOO_LONG: "Не больше 100 символов",
  AGE_YEARS_INVALID: "Укажите целое число от 0 до 40",
  AGE_MONTHS_INVALID: "Укажите целое число от 0 до 11",
  WEIGHT_NOT_POSITIVE: "Вес должен быть больше нуля",
  WEIGHT_TOO_LARGE: "Проверьте значение веса",
  BIRTH_DATE_INVALID: "Укажите прошедшую дату",
  AGE_REQUIRED: "Укажите примерный возраст",
  PHOTO_TYPE_INVALID: "Поддерживаются JPEG, PNG, WebP и HEIC.",
  PHOTO_TOO_LARGE: "Фотография должна быть не больше 10 МБ.",
};
export function errorMessage(error: unknown) {
  const value =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "";
  return t(
    errorMessages[value] ?? "Не получилось сохранить. Попробуйте ещё раз.",
  );
}
