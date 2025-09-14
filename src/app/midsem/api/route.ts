import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs'; // important: allow fs access

interface Slot {
    date: String,
    day: String,
    shift: String,
    roomno: String,
    coursecode: string,
    rollnolist: String[]
}

interface ReturnSlot {
    date: String,
    day: String,
    time: String,
    course: String,
    location: String,
}

let indexCache: Slot[] | null = null;

export async function GET(request: NextRequest) {
    const url = request.nextUrl;
    const rollno = (url.searchParams.get('idx'))?.toString().toUpperCase()
    if (!rollno) {
        return NextResponse.json({ error: 'q (roll) required' }, { status: 400 });
    }

    if (!indexCache) {
        const indexPath = path.join(process.cwd(), 'public', 'data', 'midSemSchdl.json');
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
        results: results
    }, {
        status: 200
    });
}