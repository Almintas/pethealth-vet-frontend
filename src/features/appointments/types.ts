export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export type AppointmentPatientSummary = {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail?: string | null;
};

export type VetAppointment = {
  id: string;
  petId: string;
  scheduledAt: string;
  type: string;
  status: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  clinicName?: string | null;
  veterinarianName?: string | null;
  clinicId?: string | null;
  patient: AppointmentPatientSummary;
};

export type MyAppointmentsQueryResult = {
  myAppointments: VetAppointment[];
};

export type CreateVetAppointmentInput = {
  clinicId: string;
  petId: string;
  scheduledAt: string;
  type: string;
  reason?: string;
  notes?: string;
  status?: AppointmentStatus;
};

export type UpdateVetAppointmentInput = {
  scheduledAt?: string;
  type?: string;
  reason?: string;
  notes?: string;
  status?: AppointmentStatus;
};
