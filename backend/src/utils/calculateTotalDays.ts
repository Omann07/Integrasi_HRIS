import prisma from "./prisma";

// Helper: Calculate total days based on work schedule
export async function calculateTotalDays(
    startDate: Date, 
    endDate: Date, 
    scheduleGroupId: number
): Promise<number> {
    let count = 0;
    const current = new Date(startDate);
    
    // Get work schedules for this schedule group
    const workSchedules = await prisma.workSchedule.findMany({
        where: {
            scheduleGroupId: scheduleGroupId,
            deletedAt: null
        },
        select: {
            dayOfWeek: true
        }
    });
    
    // Extract available days
    const availableDays = workSchedules.map(ws => ws.dayOfWeek);
    
    while (current <= endDate) {
        // Convert Date to DayOfWeek enum format
        const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const currentDayName = dayNames[current.getDay()];
        
        // Check if this day exists in work schedule
        if (availableDays.includes(currentDayName as any)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    return count;
}