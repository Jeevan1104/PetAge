import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", backgroundColor: "#ffffff" },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#17365D",
    paddingBottom: 15,
    marginBottom: 20,
  },
  title: { fontSize: 28, color: "#17365D", fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    color: "#ffffff",
    backgroundColor: "#1C5EA8",
    padding: 8,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 12,
    color: "#3B82C4",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 12,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 6,
  },
  colLeft: { fontSize: 10, color: "#4b5563", width: "60%" },
  colRight: { fontSize: 10, color: "#111827", width: "40%", textAlign: "right", fontWeight: "bold" },
  emptyText: { fontSize: 10, color: "#9ca3af", fontStyle: "italic", paddingVertical: 4 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});

interface FirestoreTimestamp {
  toDate: () => Date;
}

export interface ExportProfile {
  displayName?: string;
  email?: string;
  tier?: string;
  createdAt?: FirestoreTimestamp;
}

export interface ExportPet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  dob?: string;
}

export interface ExportVaccine {
  id: string;
  petId: string;
  name: string;
  dateAdministered?: FirestoreTimestamp;
}

export interface ExportMedication {
  id: string;
  petId: string;
  name: string;
  dosageStrength?: string;
  frequency: string;
}

export interface ExportVisit {
  id: string;
  petId: string;
  clinicName?: string;
  reason: string;
  date?: FirestoreTimestamp;
}

interface AccountExportProps {
  profile: ExportProfile | null;
  pets: ExportPet[];
  vaccines: ExportVaccine[];
  medications: ExportMedication[];
  vetVisits: ExportVisit[];
}

export const AccountExportDocument = ({
  profile,
  pets,
  vaccines,
  medications,
  vetVisits,
}: AccountExportProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>PetAge Account Export</Text>
          <Text style={styles.subtitle}>
            Generated on {format(new Date(), "MMM d, yyyy")} for {profile?.email || "User"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Profile</Text>
          <View style={styles.row}>
            <Text style={styles.colLeft}>Name</Text>
            <Text style={styles.colRight}>{profile?.displayName || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colLeft}>Email</Text>
            <Text style={styles.colRight}>{profile?.email || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colLeft}>Tier</Text>
            <Text style={styles.colRight}>{(profile?.tier || "Free").toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colLeft}>Account Created</Text>
            <Text style={styles.colRight}>
              {profile?.createdAt ? format(profile.createdAt.toDate(), "MMM d, yyyy") : "N/A"}
            </Text>
          </View>
        </View>

        {pets.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pets</Text>
            <Text style={styles.emptyText}>No pets found on this account.</Text>
          </View>
        )}

        {pets.map((pet) => {
          const pVaccines = vaccines.filter((v) => v.petId === pet.id);
          const pMeds = medications.filter((m) => m.petId === pet.id);
          const pVisits = vetVisits.filter((v) => v.petId === pet.id);

          return (
            <View key={pet.id} style={styles.section} break={false}>
              <Text style={styles.sectionTitle}>Pet: {pet.name}</Text>
              
              <View style={styles.row}>
                <Text style={styles.colLeft}>Species / Breed</Text>
                <Text style={styles.colRight}>{pet.species} {pet.breed ? `/ ${pet.breed}` : ""}</Text>
              </View>
              {pet.dob && (
                <View style={styles.row}>
                  <Text style={styles.colLeft}>Date of Birth</Text>
                  <Text style={styles.colRight}>{pet.dob}</Text>
                </View>
              )}

              <Text style={styles.subSectionTitle}>Vaccinations ({pVaccines.length})</Text>
              {pVaccines.length > 0 ? pVaccines.map((v) => (
                <View key={v.id} style={styles.row}>
                  <Text style={styles.colLeft}>{v.name}</Text>
                  <Text style={styles.colRight}>
                    {v.dateAdministered ? format(v.dateAdministered.toDate(), "MMM d, yyyy") : "Unknown date"}
                  </Text>
                </View>
              )) : <Text style={styles.emptyText}>No vaccines recorded.</Text>}

              <Text style={styles.subSectionTitle}>Medications ({pMeds.length})</Text>
              {pMeds.length > 0 ? pMeds.map((m) => (
                <View key={m.id} style={styles.row}>
                  <Text style={styles.colLeft}>{m.name} {m.dosageStrength ? `(${m.dosageStrength})` : ""}</Text>
                  <Text style={styles.colRight}>{m.frequency}</Text>
                </View>
              )) : <Text style={styles.emptyText}>No medications recorded.</Text>}

              <Text style={styles.subSectionTitle}>Vet Visits ({pVisits.length})</Text>
              {pVisits.length > 0 ? pVisits.map((v) => (
                <View key={v.id} style={styles.row}>
                  <Text style={styles.colLeft}>{v.clinicName || "Vet Visit"} - {v.reason}</Text>
                  <Text style={styles.colRight}>
                    {v.date ? format(v.date.toDate(), "MMM d, yyyy") : "Unknown date"}
                  </Text>
                </View>
              )) : <Text style={styles.emptyText}>No vet visits recorded.</Text>}
            </View>
          );
        })}

        <Text style={styles.footer}>
          This document is a complete data export from PetAge (petage.app). 
          It contains all records associated with this account.
        </Text>
      </Page>
    </Document>
  );
};
