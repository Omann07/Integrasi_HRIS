import { Request, Response, NextFunction } from "express";
import { 
  fromUTCToWIB, 
  toUTCFromWIB, 
  getTodayWIB, 
  formatWIB
} from "../utils/timezone";

declare global {
    namespace Express {
        interface Request {
            nowWIB: Date;
            todayWIB: string;
            toUTCFromWIB: (date: Date | string | number) => Date;
            fromUTCToWIB: (date: Date | string | number) => Date;
            formatWIB: (date: Date | string | number, pattern?: string) => string;
        }
    }
}

export function timezoneMiddleware(req: Request, res: Response, next: NextFunction) {
    // Waktu sekarang dalam WIB
    req.nowWIB = fromUTCToWIB(new Date());

    // Hari sekarang dalam WIB
    req.todayWIB = getTodayWIB();

    // Utility untuk konversi
    req.toUTCFromWIB = toUTCFromWIB;
    req.fromUTCToWIB = fromUTCToWIB;
    req.formatWIB = formatWIB;   

    next();
}
