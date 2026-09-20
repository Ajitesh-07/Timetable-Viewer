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
        const dateDiff = parseDate(a.date).getTime() - parseDate(b.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return a.time.localeCompare(b.time);
    });
}

function parseDate(dateString: string): Date {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function toLowercaseExceptFirst(str: string): string {
    if (!str) {
        return "";
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatCourse(code: string, nameMap: Record<string, string>): string {
    const name = nameMap[code.toUpperCase()];
    if (name) return `${name} (${code})`;
    return code;
}

let indexCache: Slot[] | null = null;
let nameMapCache: Record<string, string> | null = null;

export async function GET(request: NextRequest) {
    const url = request.nextUrl;
    const rollno = (url.searchParams.get('idx'))?.toString().toUpperCase();

    if (!rollno) {
        return NextResponse.json({ error: 'Roll number (idx) is required' }, { status: 400 });
    }

    if (!indexCache) {
        const indexPath = path.join(process.cwd(), 'public', 'data', 'midSemSchdl.json');
        const raw = await fs.readFile(indexPath, 'utf8');
        indexCache = JSON.parse(raw) as Slot[];
    }

    if (!nameMapCache) {
        const namePath = path.join(process.cwd(), 'public', 'data', 'courseNameMap.json');
        const raw = await fs.readFile(namePath, 'utf8');
        nameMapCache = JSON.parse(raw) as Record<string, string>;
    }

    const results: ReturnSlot[] = [];

    indexCache.forEach(slot => {
        if (slot.rollnolist.includes(rollno)) {
            results.push({
                date: slot.date,
                day: toLowercaseExceptFirst(slot.day),
                time: (slot.shift.toUpperCase() === 'MORNING') ? "10:30 - 12:30" : "15:00 - 17:00",
                course: formatCourse(slot.coursecode, nameMapCache!),
                location: slot.roomno
            });
        }
    });

    return NextResponse.json({
        results: sortReturnSlots(results)
    }, {
        status: 200
    });
}