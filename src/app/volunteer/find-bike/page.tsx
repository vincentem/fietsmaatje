'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SimpleNav } from '@/components/simple-nav';
import { HomeIcon, BikeIcon, CalendarIcon, AlertIcon, BellIcon } from '@/components/nav-icons';
import { Button } from '@/components/button';
import { Card, CardTitle, CardDescription } from '@/components/card';
import { Alert } from '@/components/alert';
import DateCalendar from '@/components/date-calendar';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Location {
  id: number;
  name: string;
  address: string;
}

interface Bike {
  id: number;
  code: string;
  name: string;
  location_id: number;
  status: string;
}

interface LocationHours {
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

type WizardStep = 'location' | 'datetime' | 'bike' | 'review';

type SummaryProps = {
  location: Location | null;
  date: string;
  time: string;
  duration: string;
  bike: Bike | null;
  feeCents: number;
  isClosed: boolean | null;
};

const STEP_ORDER: WizardStep[] = ['location', 'datetime', 'bike', 'review'];

const STEP_META: Record<WizardStep, { title: string; description: string }> = {
  location: {
    title: 'Kies een locatie',
    description: 'Selecteer waar je wilt starten. Favorieten helpen je sneller boeken.',
  },
  datetime: {
    title: 'Plan datum en tijd',
    description: 'Controleer openingstijden en kies een tijdslot passend bij je dag.',
  },
  bike: {
    title: 'Kies je duo fiets',
    description: 'Vergelijk beschikbare fietsen en markeer je favoriet voor later.',
  },
  review: {
    title: 'Bevestig reservering',
    description: 'Controleer je gegevens en bevestig je rit met één klik.',
  },
};

export default function FindBikePage() {
  const { token, user } = useAuth();
  const router = useRouter();

  // State
  const [step, setStep] = useState<WizardStep>('location');
  const [locations, setLocations] = useState<Location[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  // default to tomorrow to enforce future-only bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(format(tomorrow, 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [selectedDuration, setSelectedDuration] = useState<string>('1');
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [favoriteLocationId, setFavoriteLocationId] = useState<number | null>(null);
  const [favoriteBikeId, setFavoriteBikeId] = useState<number | null>(null);
  const [locationHours, setLocationHours] = useState<LocationHours | null>(null);
  const [dateIsOpen, setDateIsOpen] = useState<boolean | null>(null);
  const [timeAvailability, setTimeAvailability] = useState<Record<string, { available: boolean; count: number }> | null>(null);
  const [timeAvailabilityLoading, setTimeAvailabilityLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reservationFeeCents, setReservationFeeCents] = useState<number>(
    Number(process.env.NEXT_PUBLIC_RESERVATION_FEE_CENTS || 1000)
  );
  const navItems = [
    { label: 'Start', href: '/volunteer/dashboard', icon: <HomeIcon /> },
    { label: 'Reserveren', href: '/volunteer/find-bike', icon: <BikeIcon /> },
    { label: 'Reserveringen', href: '/volunteer/reservations', icon: <CalendarIcon /> },
    { label: 'Berichten', href: '/volunteer/notifications', icon: <BellIcon /> },
    { label: 'Probleem melden', href: '/volunteer/report-issue', icon: <AlertIcon /> },
  ];

  const summaryData: SummaryProps = {
    location: selectedLocation,
    date: selectedDate,
    time: selectedTime,
    duration: selectedDuration,
    bike: selectedBike,
    feeCents: reservationFeeCents,
    isClosed: dateIsOpen === null ? null : !dateIsOpen,
  };

  const getFavoritesKey = () => `favorites:${user?.id ?? 'guest'}`;

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(getFavoritesKey());
      if (!raw) return;
      const parsed = JSON.parse(raw) as { locationId?: number | null; bikeId?: number | null };
      setFavoriteLocationId(typeof parsed.locationId === 'number' ? parsed.locationId : null);
      setFavoriteBikeId(typeof parsed.bikeId === 'number' ? parsed.bikeId : null);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  }, [user]);

  const updateFavorites = (updates: { locationId?: number | null; bikeId?: number | null }) => {
    const next = {
      locationId: updates.locationId ?? favoriteLocationId ?? null,
      bikeId: updates.bikeId ?? favoriteBikeId ?? null,
    };
    setFavoriteLocationId(next.locationId);
    setFavoriteBikeId(next.bikeId);
    try {
      localStorage.setItem(getFavoritesKey(), JSON.stringify(next));
    } catch (err) {
      console.error('Failed to save favorites:', err);
    }
  };

  // Initialize
  useEffect(() => {
    if (!token) {
      router.push('/volunteer/login');
      return;
    }
    fetchLocations();
  }, [token, router]);

  useEffect(() => {
    const fetchFee = async () => {
      try {
        const response = await fetch('/api/settings/pricing');
        if (!response.ok) return;
        const data = await response.json();
        if (typeof data.fee_cents === 'number') {
          setReservationFeeCents(data.fee_cents);
        }
      } catch (err) {
        console.error('Failed to load reservation fee', err);
      }
    };
    fetchFee();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      if (response.ok) {
        setLocations(await response.json());
      }
    } catch (err) {
      setError('Locaties laden mislukt');
    }
  };

  const handleSelectLocation = async (location: Location) => {
    setSelectedLocation(location);
    setError('');
    setIsLoading(true);

    try {
      // Fetch location hours
      const response = await fetch(`/api/locations/hours?locationId=${location.id}`);
      if (response.ok) {
        const data = await response.json();
        // find hours for the currently selected date (selectedDate)
        const selectedDateObj = new Date(selectedDate);
        const weekday = selectedDateObj.getDay() === 0 ? 6 : selectedDateObj.getDay() - 1;

        const exception = data.exceptions?.find((e: any) => e.date === selectedDate);
        const hours_data = exception
          ? { open_time: exception.open_time, close_time: exception.close_time, is_closed: exception.is_closed }
          : data.weekly?.find((w: any) => w.weekday === weekday);

        if (hours_data) {
          setLocationHours({ open_time: hours_data.open_time, close_time: hours_data.close_time, is_closed: hours_data.is_closed });
          setDateIsOpen(!hours_data.is_closed);
        } else {
          setLocationHours({ open_time: '09:00', close_time: '17:00', is_closed: false });
          setDateIsOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to load location hours:', err);
      setLocationHours({ open_time: '09:00', close_time: '17:00', is_closed: false });
    } finally {
      setIsLoading(false);
    }

    setStep('datetime');
  };

  // whenever the selectedDate changes (and a location is selected), refresh hours for that date
  useEffect(() => {
    if (!selectedLocation) return;

    const fetchForDate = async () => {
      try {
        const response = await fetch(`/api/locations/hours?locationId=${selectedLocation.id}`);
        if (!response.ok) return;
        const data = await response.json();
        const exception = data.exceptions?.find((e: any) => e.date === selectedDate);
        const selectedDateObj = new Date(selectedDate);
        const weekday = selectedDateObj.getDay() === 0 ? 6 : selectedDateObj.getDay() - 1;
        const hours_data = exception
          ? { open_time: exception.open_time, close_time: exception.close_time, is_closed: exception.is_closed }
          : data.weekly?.find((w: any) => w.weekday === weekday);

        if (hours_data) {
          setLocationHours({ open_time: hours_data.open_time, close_time: hours_data.close_time, is_closed: hours_data.is_closed });
          setDateIsOpen(!hours_data.is_closed);
        } else {
          setLocationHours({ open_time: '09:00', close_time: '17:00', is_closed: false });
          setDateIsOpen(true);
        }
      } catch (err) {
        console.error('Failed to refresh hours for date:', err);
      }
    };

    fetchForDate();
  }, [selectedDate, selectedLocation]);

  useEffect(() => {
    if (step !== 'datetime') return;
    if (!selectedLocation || !selectedDate || !selectedDuration) return;

    const fetchTimeAvailability = async () => {
      try {
        setTimeAvailabilityLoading(true);
        const response = await fetch(
          `/api/availability/timebar?location_id=${selectedLocation.id}&date=${selectedDate}&duration=${selectedDuration}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          setTimeAvailability(null);
          return;
        }
        const data = await response.json();
        const map: Record<string, { available: boolean; count: number }> = {};
        for (const slot of data.slots || []) {
          map[slot.time] = { available: slot.available, count: slot.available_count || 0 };
        }
        setTimeAvailability(map);
      } catch (err) {
        console.error('Failed to load time availability:', err);
        setTimeAvailability(null);
      } finally {
        setTimeAvailabilityLoading(false);
      }
    };

    fetchTimeAvailability();
  }, [step, selectedLocation, selectedDate, selectedDuration, token]);

  const handleSelectDateTime = async () => {
    if (!selectedLocation || !selectedDuration) {
      setError('Kies een duur');
      return;
    }

    if (!selectedTime) {
      setError('Kies een starttijd');
      return;
    }

    if (locationHours?.is_closed) {
      setError('Deze locatie is gesloten op de gekozen datum');
      return;
    }

    setError('');
    await handleSelectDuration();
  };

  const handleSelectDuration = async () => {
    if (!selectedLocation || !selectedDuration) {
      setError('Kies een duur');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Validate duration against location hours
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + parseInt(selectedDuration));

      // Check against location hours
      const response = await fetch(`/api/locations/hours?locationId=${selectedLocation.id}`);
      if (response.ok) {
        const data = await response.json();
        const selectedDateObj = new Date(selectedDate);
        const weekday = selectedDateObj.getDay() === 0 ? 6 : selectedDateObj.getDay() - 1;

        const exception = data.exceptions?.find((e: any) => e.date === selectedDate);
        const hours_data = exception ? { open_time: exception.open_time, close_time: exception.close_time, is_closed: exception.is_closed }
                                  : data.weekly?.find((w: any) => w.weekday === weekday);

        if (!hours_data || hours_data.is_closed) {
          setError('Deze locatie is gesloten op de gekozen datum.');
          setStep('datetime');
          setIsLoading(false);
          return;
        }

        // Format end time for comparison
        const endTimeStr = endDateTime.toTimeString().slice(0, 5);
        if (endTimeStr > hours_data.close_time) {
          setError(`Rit moet eindigen voor ${hours_data.close_time}. Kies een kortere duur of latere starttijd.`);
          setIsLoading(false);
          return;
        }
      }

      // Fetch available bikes
      const bikesResponse = await fetch(
        `/api/bikes?location_id=${selectedLocation.id}&date=${selectedDate}&start_time=${selectedTime}&duration=${selectedDuration}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (bikesResponse.ok) {
        const bikeData = await bikesResponse.json();
        if (bikeData.length === 0) {
          setError('Geen fietsen beschikbaar op dit tijdstip. Kies een andere tijd of duur.');
          setStep('datetime');
          return;
        }
        setBikes(bikeData);
        setStep('bike');
      } else {
        const bikeData = await bikesResponse.json();
        setError(bikeData.error || 'Beschikbaarheid controleren mislukt');
        setStep('datetime');
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      setError('Fout bij het controleren van beschikbaarheid');
      setStep('datetime');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBike = (bike: Bike) => {
    setSelectedBike(bike);
    setStep('review');
  };

  const handleConfirmBooking = async () => {
    if (!selectedBike || !selectedLocation) {
      setError('Ontbrekende reserveringsgegevens');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + parseInt(selectedDuration));

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bike_id: selectedBike.id,
          location_id: selectedLocation.id,
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
        }),
      });

      if (response.ok) {
        router.push('/volunteer/reservations?success=Fiets succesvol gereserveerd!');
      } else {
        const data = await response.json();
        setError(data.error || 'Reserveren mislukt');
      }
    } catch (err) {
      setError('Fout bij het afronden van de reservering');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    const steps: WizardStep[] = ['location', 'datetime', 'bike', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
      setError('');
    }
  };

  // STEP 1: Location Selection
  if (step === 'location') {
    const favoriteLocation = favoriteLocationId
      ? locations.find((loc) => loc.id === favoriteLocationId)
      : null;

    return (
      <BookingLayout
        navItems={navItems}
        step={step}
        title={STEP_META.location.title}
        description={STEP_META.location.description}
        summary={summaryData}
      >
        {error && <Alert type="error">{error}</Alert>}

        {favoriteLocation && (
          <Card className="relative overflow-hidden rounded-[28px] border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm surface-card">
            <CardTitle className="flex items-center justify-between text-2xl text-emerald-900">
              Favoriete locatie
              <span className="text-sm font-semibold text-emerald-700">Altijd bovenaan</span>
            </CardTitle>
            <CardDescription className="mt-2 text-gray-700">
              {favoriteLocation.name} - {favoriteLocation.address}
            </CardDescription>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => handleSelectLocation(favoriteLocation)} fullWidth={false} className="w-full sm:w-auto">
                Gebruik favoriet
              </Button>
              <Button
                variant="secondary"
                fullWidth={false}
                onClick={() => updateFavorites({ locationId: null })}
                className="w-full sm:w-auto"
              >
                Verwijderen
              </Button>
            </div>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((location) => (
            <Card
              key={location.id}
              selectable
              onClick={() => handleSelectLocation(location)}
              className="cursor-pointer rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 surface-card"
            >
              <CardTitle className="flex items-center justify-between gap-3 text-2xl text-gray-900">
                <span>{location.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateFavorites({ locationId: location.id });
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    favoriteLocationId === location.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/80 text-emerald-700 border border-emerald-200 hover:border-emerald-400'
                  }`}
                >
                  {favoriteLocationId === location.id ? 'Favoriet' : 'Als favoriet'}
                </button>
              </CardTitle>
              <CardDescription className="mt-2 text-gray-600">{location.address}</CardDescription>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>Selecteer locatie</span>
                <span className="font-semibold text-emerald-600">→</span>
              </div>
            </Card>
          ))}
        </div>
      </BookingLayout>
    );
  }

  // STEP 2: Date & Time Selection
  if (step === 'datetime') {
    const times: string[] = [];
    const [openHour, openMin] = (locationHours?.open_time || '09:00').split(':').map(Number);
    const [closeHour, closeMin] = (locationHours?.close_time || '17:00').split(':').map(Number);

    for (let h = openHour; h <= closeHour; h++) {
      for (let m of [0, 30]) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        if (h < closeHour || (h === closeHour && m < closeMin)) {
          times.push(timeStr);
        }
      }
    }

    return (
      <BookingLayout
        navItems={navItems}
        step={step}
        title={STEP_META.datetime.title}
        description={STEP_META.datetime.description}
        onBack={goBack}
        summary={summaryData}
      >
        {error && <Alert type="error">{error}</Alert>}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <Card className="rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-sm surface-card">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Datum</CardTitle>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  dateIsOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {dateIsOpen ? 'Open' : 'Gesloten'}
              </span>
            </div>
            <CardDescription className="mt-2 text-gray-600">
              {selectedLocation?.name} - {locationHours?.open_time} - {locationHours?.close_time}
            </CardDescription>
            <div className="mt-4 rounded-3xl border border-white/70 bg-white p-4 shadow-inner">
              <DateCalendar
                locationId={selectedLocation?.id ?? null}
                selectedDate={selectedDate}
                setSelectedDate={(d) => setSelectedDate(d)}
                setDateIsOpen={(open) => setDateIsOpen(open)}
                daysToShow={30}
              />
            </div>
            {locationHours && dateIsOpen === false && (
              <p className="mt-3 text-sm font-semibold text-rose-600">
                Deze locatie is gesloten op de gekozen datum.
              </p>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-sm surface-card">
              <CardTitle className="text-2xl">Duur</CardTitle>
              <CardDescription className="mt-1 text-gray-600">
                Kies hoeveel uren je wilt fietsen. Beschikbaarheid past zich automatisch aan.
              </CardDescription>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setSelectedDuration(hours.toString())}
                    className={`rounded-2xl border-2 px-4 py-3 text-lg font-semibold transition ${
                      selectedDuration === hours.toString()
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg'
                        : 'border-gray-200 bg-white text-gray-900 hover:border-emerald-300'
                    }`}
                  >
                    {hours} uur
                  </button>
                ))}
              </div>
            </Card>

            <Card className="rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-sm surface-card">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Starttijd</CardTitle>
                {timeAvailabilityLoading && (
                  <span className="text-xs font-semibold text-gray-500">Beschikbaarheid controleren...</span>
                )}
              </div>
              <CardDescription className="mt-1 text-gray-600">
                Selecteer een starttijd. We tonen meteen het aantal beschikbare fietsen.
              </CardDescription>

              <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
                {times.map((time) => {
                  const slot = timeAvailability?.[time];
                  const available = dateIsOpen === false ? false : slot?.available;
                  const [h, m] = time.split(':').map(Number);
                  const endTime = new Date(selectedDate);
                  endTime.setHours(h, m, 0, 0);
                  endTime.setHours(endTime.getHours() + parseInt(selectedDuration));
                  const endTimeStr = endTime.toTimeString().slice(0, 5);

                  const detailTextClass = selectedTime === time ? 'text-white/80' : 'text-gray-500';
                  const availabilityClass =
                    selectedTime === time
                      ? available
                        ? 'text-emerald-100'
                        : 'text-rose-100'
                      : available
                      ? 'text-emerald-600'
                      : 'text-rose-600';

                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      disabled={dateIsOpen === false || available === false}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        selectedTime === time
                          ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
                          : dateIsOpen === false || available === false
                          ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                          : 'border-gray-200 bg-white text-gray-900 hover:border-blue-300'
                      }`}
                      title={
                        dateIsOpen === false
                          ? 'Gesloten'
                          : slot
                          ? `${slot.count ?? 0} fietsen beschikbaar`
                          : 'Beschikbaarheid onbekend'
                      }
                      >
                      <div>
                        <p className="text-lg font-semibold">
                          {time} - {endTimeStr}
                        </p>
                        <p className={`text-xs ${detailTextClass}`}>
                          {slot?.count ?? 0} fietsen beschikbaar
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${availabilityClass}`}>
                        {available ? 'Beschikbaar' : 'Niet beschikbaar'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>

        <FloatingActionBar>
          <Button
            onClick={handleSelectDateTime}
            size="lg"
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? 'Beschikbaarheid controleren...' : 'Doorgaan naar fietsen'}
          </Button>
        </FloatingActionBar>
      </BookingLayout>
    );
  }

  // STEP 4: Bike Selection
  if (step === 'bike') {
    const favoriteBike = favoriteBikeId ? bikes.find((b) => b.id === favoriteBikeId) : null;
    return (
      <BookingLayout
        navItems={navItems}
        step={step}
        title={STEP_META.bike.title}
        description={STEP_META.bike.description}
        onBack={goBack}
        summary={summaryData}
      >
        <p className="text-sm font-semibold text-gray-500">{bikes.length} fietsen beschikbaar</p>

        {error && <Alert type="error">{error}</Alert>}

        {favoriteBike && (
          <Card className="rounded-[28px] border border-blue-200 bg-blue-50/80 p-6 shadow-sm surface-card">
            <CardTitle className="text-2xl text-blue-900">Favoriete fiets</CardTitle>
            <CardDescription className="mt-2 text-gray-700">
              {favoriteBike.name} - Code {favoriteBike.code}
            </CardDescription>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => handleSelectBike(favoriteBike)} fullWidth={false} className="w-full sm:w-auto">
                Selecteer favoriet
              </Button>
              <Button
                variant="secondary"
                onClick={() => updateFavorites({ bikeId: null })}
                fullWidth={false}
                className="w-full sm:w-auto"
              >
                Verwijderen
              </Button>
            </div>
          </Card>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {bikes.map((bike) => {
            const isSelected = selectedBike?.id === bike.id;
            const isAvailable = bike.status === 'AVAILABLE';
            return (
              <Card
                key={bike.id}
                selectable
                selected={isSelected}
                onClick={() => isAvailable && handleSelectBike(bike)}
                className={`cursor-pointer rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 surface-card ${
                  !isAvailable ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{bike.name}</CardTitle>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {isAvailable ? 'Beschikbaar' : 'Niet beschikbaar'}
                  </span>
                </div>
                <CardDescription className="mt-2 text-gray-600">
                  Code {bike.code}
                  <br />
                  Locatie {selectedLocation?.name}
                </CardDescription>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateFavorites({ bikeId: bike.id });
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      favoriteBikeId === bike.id
                        ? 'bg-blue-600 text-white'
                        : 'border border-blue-200 bg-white text-blue-700 hover:border-blue-400'
                    }`}
                  >
                    {favoriteBikeId === bike.id ? 'Favoriet' : 'Als favoriet'}
                  </button>
                  <span className="text-gray-500">Klik om te selecteren</span>
                </div>
              </Card>
            );
          })}
        </div>
      </BookingLayout>
    );
  }

  // STEP 5: Review & Confirm
  if (step === 'review') {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(hours, minutes, 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + parseInt(selectedDuration));
    const totalCost = reservationFeeCents / 100;

    return (
      <BookingLayout
        navItems={navItems}
        step={step}
        title={STEP_META.review.title}
        description={STEP_META.review.description}
        onBack={goBack}
        summary={summaryData}
      >
        {error && <Alert type="error">{error}</Alert>}

        <Card className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-lg surface-card">
          <CardTitle className="text-2xl">Reserveringsgegevens</CardTitle>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <ReviewField label="Locatie" value={selectedLocation?.name ?? 'Nog niet gekozen'} />
            <ReviewField
              label="Fiets"
              value={
                selectedBike ? `${selectedBike.name} - Code ${selectedBike.code}` : 'Nog niet gekozen'
              }
            />
            <ReviewField
              label="Datum"
              value={startDateTime.toLocaleDateString('nl-NL', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            />
            <ReviewField
              label="Tijd"
              value={`${startDateTime.toLocaleTimeString('nl-NL', {
                hour: '2-digit',
                minute: '2-digit',
              })} - ${endDateTime.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`}
            />
            <ReviewField label="Duur" value={`${selectedDuration} uur`} />
            <ReviewField label="Prijs per reservering" value={`EUR ${totalCost.toFixed(2)}`} />
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Er wordt automatisch 30 minuten buffer toegevoegd voor en na je rit.
          </p>
        </Card>

        <FloatingActionBar>
          <Button
            onClick={handleConfirmBooking}
            size="lg"
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? 'Bezig met bevestigen...' : 'Reservering bevestigen'}
          </Button>
        </FloatingActionBar>
      </BookingLayout>
    );
  }

  return null;
}

type BookingLayoutProps = {
  navItems: { label: string; href: string; icon?: ReactNode }[];
  step: WizardStep;
  title: string;
  description: string;
  summary: SummaryProps;
  onBack?: () => void;
  children: ReactNode;
};

function BookingLayout({ navItems, step, title, description, summary, onBack, children }: BookingLayoutProps) {
  const normalizedStep = STEP_ORDER.includes(step) ? step : STEP_ORDER[0];
  return (
    <>
      <SimpleNav items={navItems} />
      <main className="container-safe whitespace-breathing">
        <section className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/80 p-8 shadow-2xl surface-card">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-16 top-6 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="absolute left-4 -bottom-10 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Reserveringswizard</p>
              <h1 className="mt-2 text-4xl font-semibold text-gray-900">{title}</h1>
              <p className="mt-2 max-w-3xl text-lg text-gray-600">{description}</p>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <StepTracker currentStep={normalizedStep} />
          </div>
        </section>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {onBack && (
              <Button
                variant="secondary"
                onClick={onBack}
                fullWidth={false}
                size="md"
                className="w-full sm:w-auto"
              >
                Terug
              </Button>
            )}
            {children}
          </div>
          <SummaryPanel {...summary} />
        </div>
      </main>
    </>
  );
}

function StepTracker({ currentStep }: { currentStep: WizardStep }) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  return (
    <ol className="flex flex-wrap gap-4">
      {STEP_ORDER.map((step, index) => {
        const meta = STEP_META[step];
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;
        return (
          <li
            key={step}
            className={`flex items-center gap-3 rounded-full border px-4 py-2 text-left text-sm ${
              isActive
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : isComplete
                ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                : 'border-white/60 bg-white/70 text-gray-500'
            }`}
          >
            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold ${
                isComplete ? 'bg-emerald-500 text-white' : isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {isComplete ? 'OK' : index + 1}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">{meta.title}</p>
              <p className="text-[11px] text-gray-600">{meta.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function SummaryPanel({ location, date, time, duration, bike, feeCents, isClosed }: SummaryProps) {
  const hasDate = Boolean(date);
  const summaryDate = hasDate
    ? format(new Date(date), "EEEE d MMMM", { locale: nl })
    : 'Nog niet gekozen';

  let timeWindow = 'Nog niet gekozen';
  if (date && time) {
    const [h, m] = time.split(':').map(Number);
    if (!Number.isNaN(h)) {
      const start = new Date(date);
      start.setHours(h, m, 0, 0);
      const end = new Date(start);
      end.setHours(end.getHours() + parseInt(duration || '1'));
      timeWindow = `${start.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  const feeValue = `EUR ${(feeCents / 100).toFixed(2)}`;

  return (
    <aside className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-lg surface-card">
      <CardTitle className="text-xl text-gray-900">Overzicht</CardTitle>
      <CardDescription className="mt-1 text-gray-500">Je keuzes tot nu toe</CardDescription>
      <div className="mt-4 space-y-4">
        <SummaryRow label="Locatie" value={location?.name ?? 'Nog niet gekozen'} />
        <SummaryRow label="Datum" value={summaryDate} />
        <SummaryRow label="Tijd" value={timeWindow} />
        <SummaryRow label="Duur" value={`${duration} uur`} />
        <SummaryRow
          label="Fiets"
          value={bike ? `${bike.name} (code ${bike.code})` : 'Nog niet gekozen'}
        />
        <SummaryRow
          label="Status"
          value={
            isClosed === null ? 'Onbekend' : isClosed ? 'Gesloten op deze dag' : 'Open op deze dag'
          }
          muted={isClosed === true}
        />
      </div>
      <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
          Tarief
        </p>
        <p className="mt-2 text-3xl font-semibold text-emerald-900">{feeValue}</p>
        <p className="text-sm text-emerald-700">Per reservering, ongeacht duur.</p>
      </div>
    </aside>
  );
}

function SummaryRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">{label}</p>
      <p className={`text-base font-semibold ${muted ? 'text-rose-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-sm surface-card">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function FloatingActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 border-t border-white/70 bg-white/95 px-6 py-4 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  );
}
