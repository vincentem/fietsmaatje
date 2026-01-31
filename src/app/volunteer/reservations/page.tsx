import { Suspense } from 'react';
import ReservationsClient from './ReservationsClient';

export default function ReservationsPage() {
  return (
    <Suspense fallback={null}>
      <ReservationsClient />
    </Suspense>
  );
}