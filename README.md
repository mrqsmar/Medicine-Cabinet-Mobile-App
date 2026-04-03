# Medicine Cabinet

A mobile medication management app built for older adults (60+). Track daily medications, get refill and expiration warnings, and receive push notification reminders — all with an accessibility-first design featuring large text, high-contrast colors, and 48dp tap targets.

## Features

- **Daily Medication Checklist** — Mark doses as taken with large checkmark buttons, track progress with a visual progress bar
- **Smart Reminders** — Local push notifications based on each medication's recurrence (Daily/Weekly/Monthly), with deep-link back to the Home screen
- **Refill & Expiration Alerts** — Warning banners when pill supply drops below 7 days or prescriptions expire within 14 days
- **Photo + AI Recognition** — Snap a photo of a pill and auto-fill medication details using the Claude API
- **Medication Management** — Full CRUD with dosage, prescribing doctor, start/expiration dates, recurrence, color/shape, and notes
- **Reminders Screen** — View, edit, enable/disable, and delete notification schedules per medication
- **Local-First Storage** — All data stored on-device with SQLite (no account required)

## Tech Stack

- React Native + Expo SDK 53
- TypeScript (strict mode)
- expo-sqlite for local persistence
- expo-notifications for push notifications
- expo-image-picker for camera/gallery
- React Navigation (bottom tabs + native stack)
- React Context + useReducer for state management
- date-fns for date formatting

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — installed automatically via npx
- For iOS: Xcode (macOS only) or Expo Go app on a physical iPhone
- For Android: Android Studio with an emulator, or Expo Go app on a physical device

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npx expo start
```

This opens the Expo dev tools. From there you can:

- **Press `a`** to open on an Android emulator
- **Press `i`** to open on an iOS simulator (macOS only)
- **Scan the QR code** with the Expo Go app on your phone to run on a physical device

### Run directly on a platform

```bash
# Android
npx expo start --android

# iOS (macOS only)
npx expo start --ios
```

### Optional: AI Photo Recognition

To enable automatic medication identification from pill photos:

1. Get an API key from [Anthropic](https://console.anthropic.com/)
2. Open the app and go to **Settings**
3. Paste your API key in the **AI Photo Recognition** section
4. When adding a medication, tap the camera icon to snap a photo — the app will auto-fill the name, dosage, and form

## Project Structure

```
src/
  components/      # Shared UI: BigButton, CancelSaveBar, SegmentedControl, MedCard, CheckmarkBadge
  context/         # MedicationContext (useReducer + React Context)
  database/        # SQLite schema, migrations, and CRUD operations
  navigation/      # Bottom tab navigator + root stack
  screens/         # Home, Medications, AddEditMedication, MedicationDetail, Reminders, Settings
  seed/            # Sample data for first launch
  services/        # Notification scheduling, AI medication recognition
  theme/           # Design system: colors, fonts, spacing, shadows
  types/           # TypeScript interfaces (Medication, DoseLog, ReminderSchedule)
```
