export const DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DAY_TO_ENUM: Record<string, string> = {
  Monday: "MONDAY", Tuesday: "TUESDAY", Wednesday: "WEDNESDAY",
  Thursday: "THURSDAY", Friday: "FRIDAY", Saturday: "SATURDAY", Sunday: "SUNDAY"
};

const DAY_LABEL: Record<string, string> = {
  MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday"
};

const timeToDot = (v: string) => (v ? v.replace(":", ".") : "");
const dotToTime = (v: string) => (v ? v.replace(".", ":") : "");

export const mapScheduleToUI = (apiData: any[]) => {
  return apiData.map((x) => ({
    id: x.id,
    companyId: String(x.companyId),
    scheduleGroupId: x.scheduleGroupId,
    scheduleGroup: x.scheduleGroup?.nameOfShift || "N/A",
    dayOfWeek: DAY_LABEL[x.dayOfWeek] || x.dayOfWeek,
    startTime: x.startTime,
    breakStart: x.breakStart,
    breakEnd: x.breakEnd,
    endTime: x.endTime,
  }));
};

export const mapFormToPayload = (form: any) => ({
  ...form,
  companyId: Number(form.companyId),
  dayOfWeek: DAY_TO_ENUM[form.dayOfWeek] || form.dayOfWeek,
  startTime: timeToDot(form.startTime),
  breakStart: timeToDot(form.breakStart),
  breakEnd: timeToDot(form.breakEnd),
  endTime: timeToDot(form.endTime),
});

export const mapToFormFields = (row: any) => ({
  companyId: row.companyId,
  scheduleGroupId: row.scheduleGroupId,
  dayOfWeek: row.dayOfWeek,
  startTime: dotToTime(row.startTime),
  breakStart: dotToTime(row.breakStart),
  breakEnd: dotToTime(row.breakEnd),
  endTime: dotToTime(row.endTime),
});

// Tambahkan di file mapper yang sudah ada
export const mapWorkScheduleEmployee = (item: any) => ({
  id: item.id,
  // Mengatasi error: ambil string nameOfShift dari dalam object scheduleGroup
  shift: item.scheduleGroup?.nameOfShift || "N/A", 
  dayOfWeek: DAY_LABEL[item.dayOfWeek] || item.dayOfWeek,
  startTime: item.startTime,
  // Gabungkan break start dan end agar rapi di kolom "Break Time"
  breakTime: item.breakStart && item.breakEnd ? `${item.breakStart} - ${item.breakEnd}` : "-",
  endTime: item.endTime,
});