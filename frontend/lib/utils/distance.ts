export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
  
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
  
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000; // meter
  }
  
  export function formatDistance(meter: number): string {
    if (meter < 1000) return `${Math.round(meter)} m`;
    return `${(meter / 1000).toFixed(2)} km`;
  }
  