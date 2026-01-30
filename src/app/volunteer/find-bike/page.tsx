'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SimpleNav } from '@/components/simple-nav';
import { HomeIcon, BikeIcon, CalendarIcon, AlertIcon, BellIcon } from '@/components/nav-icons';
import { Button } from '@/components/button';
import { Card, CardTitle, CardDescription } from '@/components/card';
import { Alert } from '@/components/alert';
import DateCalendar from '@/components/date-calendar';
import { format } from 'date-fns';

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

type WizardStep = 'location' | 'datetime' | 'duration' | 'bike' | 'review';

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
      <>
        <SimpleNav items={navItems} />
        <main className="container-safe whitespace-breathing">
          <div className="max-w-2xl mx-auto pb-24 md:pb-0">
            <h1>Kies een locatie</h1>
            <p className="text-lg text-gray-600 mb-8">Waar wil je fietsen?</p>

            {error && <Alert type="error">{error}</Alert>}

            {favoriteLocation && (
              <Card className="mb-6 bg-blue-50 border-blue-300">
                <CardTitle>Favoriete locatie</CardTitle>
                <CardDescription>{favoriteLocation.name} - {favoriteLocation.address}</CardDescription>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => handleSelectLocation(favoriteLocation)}>Gebruik favoriet</Button>
                  <Button variant="secondary" onClick={() => updateFavorites({ locationId: null })}>Verwijderen</Button>
                </div>
              </Card>
            )}

            <div className="space-y-4 staggered">
              {locations.map((location) => (
                <Card
                  key={location.id}
                  selectable
                  onClick={() => handleSelectLocation(location)}
                  className="cursor-pointer"
                >
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span>{location.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateFavorites({ locationId: location.id });
                      }}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                        favoriteLocationId === location.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-blue-700 border-blue-300 hover:border-blue-500'
                      }`}
                    >
                      {favoriteLocationId === location.id ? 'Favoriet' : 'Als favoriet'}
                    </button>
                  </CardTitle>
                  <CardDescription>{location.address}</CardDescription>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  // STEP 2: Date & Time Selection
  if (step === 'datetime') {
    // Generate time slots based on location hours
    const times: string[] = [];
    const [openHour, openMin] = (locationHours?.open_time || '09:00').split(':').map(Number);
    const [closeHour, closeMin] = (locationHours?.close_time || '17:00').split(':').map(Number);

    for (let h = openHour; h <= closeHour; h++) {
      for (let m of [0, 30]) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        // Only add if it's before closing time
        if (h < closeHour || (h === closeHour && m < closeMin)) {
          times.push(timeStr);
        }
      }
    }

    return (
      <>
        <SimpleNav items={navItems} />
        <main className="container-safe whitespace-breathing">
          <div className="max-w-2xl mx-auto">
            <Button variant="secondary" onClick={goBack} className="mb-6">
              Terug
            </Button>

            <h1>Kies datum en tijd</h1>
            <p className="text-lg text-gray-600 mb-8">
              {selectedLocation?.name} is {locationHours?.is_closed ? 'GESLOTEN' : `open van ${locationHours?.open_time} tot ${locationHours?.close_time}`}
            </p>

            {error && <Alert type="error">{error}</Alert>}

            <div className="mb-8">
              <label className="flex items-center justify-between text-2xl font-bold mb-4">
                <span>Datum</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${dateIsOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {dateIsOpen ? 'Open' : 'Gesloten'}
                </span>
              </label>
              {/* Calendar showing next 30 days with open/closed highlights */}
              <DateCalendar
                locationId={selectedLocation?.id ?? null}
                selectedDate={selectedDate}
                setSelectedDate={(d) => setSelectedDate(d)}
                setDateIsOpen={(open) => setDateIsOpen(open)}
                daysToShow={30}
              />
            {locationHours && !dateIsOpen && (
              <p className="mt-2 text-sm text-red-700">Deze locatie is gesloten op de gekozen datum.</p>
            )}
          </div>

            <div className="mb-8">
              <label className="block text-2xl font-bold mb-4">Duur</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setSelectedDuration(hours.toString())}
                    className={`p-4 rounded-lg font-bold text-xl transition-all ${
                      selectedDuration === hours.toString()
                        ? 'bg-blue-600 text-white border-2 border-blue-600'
                        : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-3">Beschikbaarheid past zich aan op basis van de duur.</p>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-2xl font-bold">Starttijd</label>
                {timeAvailabilityLoading && <span className="text-xs text-gray-500">Controleren...</span>}
              </div>
              <p className="text-sm text-gray-600 mb-3">Kies een starttijd. De eindtijd past zich aan op basis van de gekozen duur.</p>
              <div className="space-y-2">
                {times.map((time) => {
                  const slot = timeAvailability?.[time];
                  const available = dateIsOpen === false ? false : slot?.available;
                  const [h, m] = time.split(':').map(Number);
                  const endTime = new Date(selectedDate);
                  endTime.setHours(h, m, 0, 0);
                  endTime.setHours(endTime.getHours() + parseInt(selectedDuration));
                  const endTimeStr = endTime.toTimeString().slice(0, 5);
                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      disabled={dateIsOpen === false || available === false}
                      className={`w-full text-left rounded-lg border p-4 transition-all ${
                        selectedTime === time
                          ? 'bg-blue-600 text-white border-blue-600'
                          : dateIsOpen === false || available === false
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                      }`}
                      title={
                        dateIsOpen === false
                          ? 'Gesloten'
                          : slot
                          ? `${slot.count ?? 0} beschikbaar`
                          : 'Beschikbaarheid onbekend'
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold">
                          {time} {'->'} {endTimeStr}
                        </div>
                        <div className={`text-sm font-semibold ${available ? 'text-green-700' : 'text-red-600'}`}>
                          {available ? `${slot?.count ?? 0} fietsen` : 'Niet beschikbaar'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:static fixed bottom-20 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur md:border-0 md:bg-transparent md:p-0">
              <div className="max-w-2xl mx-auto">
                <Button onClick={handleSelectDateTime} size="lg" disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Beschikbaarheid controleren...' : 'Doorgaan'}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // STEP 3: Duration Selection
  if (step === 'duration') {
    return (
      <>
        <SimpleNav items={navItems} />
        <main className="container-safe whitespace-breathing">
          <div className="max-w-2xl mx-auto pb-24 md:pb-0">
            <Button variant="secondary" onClick={goBack} className="mb-6">
              Terug
            </Button>

            <h1>Hoe lang?</h1>
            <p className="text-lg text-gray-600 mb-8">Minimaal 1 uur. Beschikbaar in stappen van 30 minuten.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                <button
                  key={hours}
                  onClick={() => setSelectedDuration(hours.toString())}
                  className={`p-4 rounded-lg font-bold text-xl transition-all ${
                    selectedDuration === hours.toString()
                      ? 'bg-blue-600 text-white border-2 border-blue-600'
                      : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>

            <div className="md:static fixed bottom-20 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur md:border-0 md:bg-transparent md:p-0">
              <div className="max-w-2xl mx-auto">
                <Button onClick={handleSelectDuration} size="lg" disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Beschikbaarheid controleren...' : 'Beschikbaarheid controleren'}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // STEP 4: Bike Selection
  if (step === 'bike') {
    const favoriteBike = favoriteBikeId ? bikes.find((b) => b.id === favoriteBikeId) : null;
    return (
      <>
        <SimpleNav items={navItems} />
        <main className="container-safe whitespace-breathing">
          <div className="max-w-4xl mx-auto">
            <Button variant="secondary" onClick={goBack} className="mb-6">
              Terug
            </Button>

            <h1>Kies een fiets</h1>
            <p className="text-lg text-gray-600 mb-8">{bikes.length} fietsen beschikbaar</p>

              {error && <Alert type="error">{error}</Alert>}

              {favoriteBike && (
                <Card className="mb-6 bg-blue-50 border-blue-300">
                  <CardTitle>Favoriete fiets</CardTitle>
                  <CardDescription>
                    {favoriteBike.name} - Code: <strong>{favoriteBike.code}</strong>
                  </CardDescription>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={() => handleSelectBike(favoriteBike)}>Selecteer favoriet</Button>
                    <Button variant="secondary" onClick={() => updateFavorites({ bikeId: null })}>Verwijderen</Button>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 staggered">
                {bikes.map((bike) => (
                  <Card
                    key={bike.id}
                    selectable
                    selected={selectedBike?.id === bike.id}
                    onClick={() => bike.status === 'AVAILABLE' && handleSelectBike(bike)}
                    className="cursor-pointer"
                  >
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span>{bike.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateFavorites({ bikeId: bike.id });
                        }}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                          favoriteBikeId === bike.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-700 border-blue-300 hover:border-blue-500'
                        }`}
                      >
                        {favoriteBikeId === bike.id ? 'Favoriet' : 'Als favoriet'}
                      </button>
                    </CardTitle>
                  <CardDescription>
                    Code: <strong>{bike.code}</strong>
                    <br />
                    Status:{' '}
                    <strong className={bike.status === 'AVAILABLE' ? 'text-green-600' : 'text-red-600'}>
                      {bike.status === 'AVAILABLE' ? 'Beschikbaar' : 'Buiten gebruik'}
                    </strong>
                  </CardDescription>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </>
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
      <>
        <SimpleNav items={navItems} />
        <main className="container-safe whitespace-breathing">
          <div className="max-w-2xl mx-auto pb-24 md:pb-0">
            <Button variant="secondary" onClick={goBack} className="mb-6">
              Terug
            </Button>

            <h1>Controleer je reservering</h1>

            {error && <Alert type="error">{error}</Alert>}

            <Card className="mb-8 border-blue-300 bg-blue-50">
              <CardTitle className="mb-4">Reserveringsgegevens</CardTitle>

              <div className="space-y-4 text-lg">
                <div>
                  <p className="text-gray-600">Locatie</p>
                  <p className="text-2xl font-bold">{selectedLocation?.name}</p>
                </div>

                <div>
                  <p className="text-gray-600">Fiets</p>
                  <p className="text-2xl font-bold">{selectedBike?.name}</p>
                  <p className="text-gray-600">Code: {selectedBike?.code}</p>
                </div>

                <div>
                  <p className="text-gray-600">Datum</p>
                  <p className="text-2xl font-bold">
                    {startDateTime.toLocaleDateString('nl-NL', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">Tijd</p>
                  <p className="text-2xl font-bold">
                    {startDateTime.toLocaleTimeString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    tot{' '}
                    {endDateTime.toLocaleTimeString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">Duur</p>
                  <p className="text-2xl font-bold">{selectedDuration} uur</p>
                </div>

                <div>
                  <p className="text-gray-600">Prijs per reservering</p>
                  <p className="text-2xl font-bold">EUR {totalCost.toFixed(2)}</p>
                  <p className="text-gray-500 text-sm">Vaste prijs, onafhankelijk van de duur</p>
                </div>
              </div>
            </Card>

            <div className="md:static fixed bottom-20 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur md:border-0 md:bg-transparent md:p-0">
              <div className="max-w-2xl mx-auto">
                <Button onClick={handleConfirmBooking} size="lg" disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Bezig met bevestigen...' : 'Reservering bevestigen'}
                </Button>
              </div>
            </div>

            <p className="text-center text-gray-600 mt-4">
              Er wordt 30 minuten buffer toegevoegd voor en na je rit.
            </p>
          </div>
        </main>
      </>
    );
  }

  return null;
}
