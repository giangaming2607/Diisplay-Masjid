import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import moment from "moment-hijri";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getNextIslamicEvent(now: Date) {
  const m = moment(now);
  const currentY = m.iYear();
  
  const events = [
    { name: 'Tahun Baru Islam', iMonth: 0, iDate: 1 }, // Muharram
    { name: 'Maulid Nabi Muhammad SAW', iMonth: 2, iDate: 12 }, // Rabiul Awal
    { name: 'Isra Mi\'raj Nabi Muhammad SAW', iMonth: 6, iDate: 27 }, // Rajab
    { name: 'Awal Bulan Ramadhan', iMonth: 8, iDate: 1 }, // Ramadhan
    { name: 'Idul Fitri', iMonth: 9, iDate: 1 }, // Syawal
    { name: 'Idul Adha', iMonth: 11, iDate: 10 }, // Dzulhijjah
  ];

  let nextEvent = null;
  let minDiff = Infinity;

  for (let event of events) {
    // Check for this year
    let eventMom = moment(`${currentY}/${event.iMonth + 1}/${event.iDate}`, 'iYYYY/iM/iD');
    let diff = eventMom.diff(m, 'days');
    
    // If event is passed this year, check next year
    if (diff < 0) {
      eventMom = moment(`${currentY + 1}/${event.iMonth + 1}/${event.iDate}`, 'iYYYY/iM/iD');
      diff = eventMom.diff(m, 'days');
    }

    if (diff >= 0 && diff < minDiff) {
      minDiff = diff;
      nextEvent = { ...event, daysLeft: diff, moment: eventMom };
    }
  }

  return nextEvent;
}

// Convert coordinates to standard prayertimes
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

export function getPrayerTimes(date: Date, lat: number, lng: number) {
  const coordinates = new Coordinates(lat, lng);
  const params = CalculationMethod.Singapore(); // Ministry of Religious Affairs standard is closest to Singapore / Egypt / MWL depending on settings. Usually, Indonesia uses custom angles, but 'Singapore' or Egyptian is often close. Let's stick with Egyptian or MWL for demo, or simply manually adjust.
  params.fajrAngle = 20; // Kemenag standard
  params.ishaAngle = 18; // Kemenag standard

  return new PrayerTimes(coordinates, date, params);
}
