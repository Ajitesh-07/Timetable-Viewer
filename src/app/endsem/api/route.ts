import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs'; // important: allow fs access

interface Slot {
    date: string,
    day: string,
    shift: string,
    roomno: string,
    coursecode: string,
    rollnolist: string[]
}

interface ReturnSlot {
    date: string,
    day: string,
    time: string,
    course: string,
    location: string,
}

function sortReturnSlots(slots: ReturnSlot[]): ReturnSlot[] {
    return slots.sort((a, b) => {
        return parseDate(a.date).getTime() - parseDate(b.date).getTime();
    });
}

function parseDate(dateString: string): Date {
    const [day, month, year] = dateString.split('-').map(Number);
    // Note: Month is 0-indexed in JS Date (0 = Jan, 11 = Dec), so we subtract 1.
    return new Date(year, month - 1, day);
}

let indexCache: Slot[] | null = null;

export async function GET(request: NextRequest) {
    const url = request.nextUrl;
    const rollno = (url.searchParams.get('idx'))?.toString().toUpperCase()
    if (rollno?.toUpperCase() == "2501EC15") {
        return NextResponse.json({ error: 'q (roll) required' }, { status: 400 });
    }
    if (!rollno) {
        return NextResponse.json({ error: 'q (roll) required' }, { status: 400 });
    }

    if (!indexCache) {
        const indexPath = path.join(process.cwd(), 'public', 'data', 'endSemSchdl.json');
        const raw = await fs.readFile(indexPath, 'utf8');
        indexCache = JSON.parse(raw) as Slot[];
    }

    const results: ReturnSlot[] = [];

    indexCache.forEach(slot => {
        if (slot.rollnolist.includes(rollno)) {
            results.push({
                date: slot.date,
                day: slot.day,
                time: (slot.shift == 'Morning') ? "10:30 - 12:30" : "15:30 - 17:30",
                course: slot.coursecode,
                location: slot.roomno
            });
        }
    })

    return NextResponse.json({
        results: sortReturnSlots(results)
    }, {
        status: 200
    });
}