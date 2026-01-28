function toMinutes(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }
  
  export function calculateWorkHours(
    start: string,
    end: string,
    breakStart: string,
    breakEnd: string
  ): number {
    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
    const breakStartMin = toMinutes(breakStart);
    const breakEndMin = toMinutes(breakEnd);
  
    const totalWork = endMin - startMin;
    const breakTime = breakEndMin - breakStartMin;
  
    return Math.max((totalWork - breakTime) / 60, 0);
  }
  