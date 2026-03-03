import type { CategoryKey } from "@/components/CategoryIcon";

export interface Issue {
  id: string;
  category: CategoryKey;
  description: string;
  location: string;
  time: string;
  status: "open" | "in-progress" | "resolved";
  severity: "low" | "medium" | "high";
  lat: number;
  lng: number;
}

export const mockIssues: Issue[] = [
  { id: "1", category: "pothole", description: "Large pothole near main junction causing traffic issues", location: "MG Road", time: "2h ago", status: "open", severity: "high", lat: 12.9716, lng: 77.5946 },
  { id: "2", category: "streetlight", description: "Streetlight not working for 3 days", location: "Brigade Rd", time: "5h ago", status: "in-progress", severity: "medium", lat: 12.9726, lng: 77.6076 },
  { id: "3", category: "drainage", description: "Drainage overflow during rain", location: "Koramangala", time: "1d ago", status: "open", severity: "high", lat: 12.9352, lng: 77.6245 },
  { id: "4", category: "vegetation", description: "Trees fallen blocking the road", location: "Indiranagar", time: "3h ago", status: "resolved", severity: "low", lat: 12.9784, lng: 77.6408 },
  { id: "5", category: "sewage", description: "Sewage leak near residential area", location: "Jayanagar", time: "6h ago", status: "open", severity: "high", lat: 12.9308, lng: 77.5838 },
  { id: "6", category: "flooding", description: "Road waterlogging after rain", location: "Hebbal", time: "8h ago", status: "in-progress", severity: "medium", lat: 13.0358, lng: 77.5970 },
  { id: "7", category: "encroachment", description: "Illegal shop encroaching footpath", location: "Malleshwaram", time: "2d ago", status: "open", severity: "low", lat: 13.0035, lng: 77.5648 },
  { id: "8", category: "construction", description: "Unauthorized construction on lake bed", location: "Bellandur", time: "4h ago", status: "open", severity: "high", lat: 12.9260, lng: 77.6762 },
];
