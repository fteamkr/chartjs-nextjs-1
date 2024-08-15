import dayjs from "dayjs"; // https://day.js.org
import LocalizedFormat from "dayjs/plugin/localizedFormat.js"; // https://day.js.org/docs/en/plugin/localized-format
import "dayjs/locale/ko"; // https://day.js.org/docs/en/i18n/loading-into-nodejs

dayjs.extend(LocalizedFormat);
dayjs.locale("ko");

export default dayjs;
