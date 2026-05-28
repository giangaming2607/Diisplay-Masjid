import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
