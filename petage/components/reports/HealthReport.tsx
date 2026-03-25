import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Pet, VetVisit, Medication, Vaccine, WeightLog } from "@/lib/types";
import { format } from "date-fns";

// Register custom fonts if needed; for now we rely on standard Helveticas available internally.
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: "#17365D",
    paddingBottom: 15,
    marginBottom: 20,
  },
  titleContainer: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: 28,
    color: "#17365D",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  petName: {
    fontSize: 24,
    color: "#3B82C4",
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#17365D",
    backgroundColor: "#f3f4f6",
    padding: 6,
    fontWeight: "bold",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
  },
  colLeft: {
    fontSize: 10,
    color: "#4b5563",
    width: "60%",
  },
  colRight: {
    fontSize: 10,
    color: "#111827",
    width: "40%",
    textAlign: "right",
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: 10,
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },
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
  }
});

interface HealthReportProps {
  pet: Pet;
  vaccines: Vaccine[];
  visits: VetVisit[];
  medications: Medication[];
  weightLogs: WeightLog[];
}

export const HealthReportDocument = ({
  pet,
  vaccines,
  visits,
  medications,
  weightLogs,
}: HealthReportProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Pet Health Record</Text>
            <Text style={styles.subtitle}>Generated on {format(new Date(), "MMM d, yyyy")}</Text>
          </View>
          <Text style={styles.petName}>{pet.name}</Text>
        </View>

        {/* PET PROFILE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          <View style={styles.row}>
            <Text style={styles.colLeft}>Species</Text>
            <Text style={styles.colRight}>{pet.species.toUpperCase()}</Text>
          </View>
          {pet.breed && (
            <View style={styles.row}>
              <Text style={styles.colLeft}>Breed</Text>
              <Text style={styles.colRight}>{pet.breed}</Text>
            </View>
          )}
          {pet.microchipId && (
            <View style={styles.row}>
              <Text style={styles.colLeft}>Microchip ID</Text>
              <Text style={styles.colRight}>{pet.microchipId}</Text>
            </View>
          )}
        </View>

        {/* VACCINES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vaccination History</Text>
          {vaccines.length > 0 ? vaccines.map((v) => (
            <View key={v.vaccineId} style={styles.row}>
              <Text style={styles.colLeft}>{v.name}</Text>
              <Text style={styles.colRight}>{format(v.dateAdministered.toDate(), "MMM d, yyyy")}</Text>
            </View>
          )) : (
            <Text style={styles.emptyText}>No vaccination records found</Text>
          )}
        </View>

        {/* MEDICATIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Medications</Text>
          {medications.filter(m => !m.isArchived).length > 0 ? 
            medications.filter(m => !m.isArchived).map((m) => (
              <View key={m.medicationId} style={styles.row}>
                <Text style={styles.colLeft}>
                  {m.name} {m.dosageStrength ? `(${m.dosageStrength})` : ""} - {m.frequency}
                </Text>
                <Text style={styles.colRight}>Started Docs</Text>
              </View>
          )) : (
            <Text style={styles.emptyText}>No active medications found</Text>
          )}
        </View>

        {/* WEIGHT & VISITS OVERVIEW */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Vitals</Text>
          <Text style={styles.emptyText}>Recorded {weightLogs.length} weight logs and {visits.length} vet visits.</Text>
        </View>

        <Text style={styles.footer}>
          This document is electronically generated by PetAge (petage.app) and serves as an informal tracking history.
        </Text>
      </Page>
    </Document>
  );
};
