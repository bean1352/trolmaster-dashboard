"use client";

import { useEffect, useState } from "react";
import { controllerGroups } from "./lib/controllers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SensorItem {
  hy: string;
  d_n: string;
  co2: string;
  lp: string;
  timestamp: number;
  ct_tm: string;
  vpd: string;
  mac: string;
  tp: string;
  light_status: string;
}

interface ApiResponse {
  Item?: SensorItem;
  [key: string]: unknown;
}

interface SensorData {
  name: string;
  mac: string;
  data: ApiResponse;
  loading: boolean;
}

interface GroupedSensorData {
  groupName: string;
  controllers: SensorData[];
}

export default function Dashboard() {
  const [groupedData, setGroupedData] = useState<GroupedSensorData[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  const fetchAllData = async (isInitialLoad = false) => {
    if (isInitialLoad) setInitialLoading(true);

    const entries = Object.entries(controllerGroups);

    const groupResults = await Promise.all(
      entries.map(async ([groupName, rooms]) => {
        const controllers = await Promise.all(
          Object.entries(rooms).map(async ([name, mac]) => {
            try {
              const res = await fetch(`/api/sensor?mac=${mac}`);
              const data: ApiResponse = await res.json();
              return { name, mac, data, loading: false };
            } catch (error) {
              return {
                name,
                mac,
                data: { error: `Failed to fetch: ${error}` },
                loading: false,
              };
            }
          })
        );

        return { groupName, controllers };
      })
    );

    setGroupedData(groupResults);
    if (isInitialLoad) setInitialLoading(false);
  };

  // Refresh individual controllers without blocking the whole UI
  const refreshControllersSilently = async () => {
    const entries = Object.entries(controllerGroups);

    const groupResults = await Promise.all(
      entries.map(async ([groupName, rooms]) => {
        const controllers = await Promise.all(
          Object.entries(rooms).map(async ([name, mac]) => {
            try {
              const res = await fetch(`/api/sensor?mac=${mac}`);
              const data: ApiResponse = await res.json();
              return { name, mac, data, loading: false };
            } catch (error) {
              return {
                name,
                mac,
                data: { error: `Failed to fetch: ${error}` },
                loading: false,
              };
            }
          })
        );

        return { groupName, controllers };
      })
    );

    setGroupedData(groupResults);
  };


  useEffect(() => {
    fetchAllData(true);
    const interval = setInterval(() => {
      refreshControllersSilently();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const displayGroups =
    selectedGroup === "all"
      ? groupedData
      : groupedData.filter((group) => group.groupName === selectedGroup);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Controller Dashboard</h1>

      {/* Loading Overlay */}
      {initialLoading && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      {/* Group Selector */}
      <div className="max-w-sm">
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger>
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {Object.keys(controllerGroups).map((key) => (
              <SelectItem key={key} value={key}>
                {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grouped Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-6">
        {displayGroups
          .flatMap(({ controllers }) => controllers)
          .map(({ name, mac, data, loading }) => (
            <Card key={mac} className="shadow-md relative">
              <CardHeader>
                <CardTitle className="text-lg">{name}</CardTitle>
                <p className="text-sm text-muted-foreground">MAC: {mac}</p>
                {loading && (
                  <Loader2 className="absolute top-4 right-4 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {data?.Item ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      🌡️ <span className="font-medium">Temp:</span>{" "}
                      {((parseFloat(data.Item.tp) - 32) * 5 / 9).toFixed(1)}°C
                    </div>
                    <div className="flex items-center gap-2">
                      💧 <span className="font-medium">Humidity:</span>{" "}
                      {data.Item.hy}%
                    </div>
                    <div className="flex items-center gap-2">
                      🌿 <span className="font-medium">CO₂:</span>{" "}
                      {data.Item.co2} ppm
                    </div>
                    <div className="flex items-center gap-2">
                      🔆 <span className="font-medium">Light:</span>{" "}
                      {data.Item.light_status === "1" ? "On" : "Off"}
                    </div>
                    <div className="flex items-center gap-2">
                      🌬️ <span className="font-medium">VPD:</span>{" "}
                      {data.Item.vpd}
                    </div>
                    <div className="flex items-center gap-2">
                      🕒 <span className="font-medium">Time:</span>{" "}
                      {data.Item.ct_tm}
                    </div>
                  </div>
                ) : (
                  <p className="text-destructive">Error showing data</p>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

    </div>
  );
}
