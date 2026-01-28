// lib/shiftMapper.ts
export type ShiftUI = {
  id: number;
  shift: string;
  company: string;
};

export const mapShift = (item: any): ShiftUI => ({
  id: item.id,
  shift: item.nameOfShift,
  company: item.company?.companyName ?? "-",
});
