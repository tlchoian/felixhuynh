import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VlanSchema {
  id: string;
  vlan_id: number;
  name: string;
  subnet: string;
  gateway: string;
  range_start: string;
}

export function useVlanSchemas() {
  const [vlanSchemas, setVlanSchemas] = useState<VlanSchema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVlanSchemas = async () => {
      try {
        const { data, error } = await supabase
          .from("vlan_schemas")
          .select("*")
          .order("vlan_id");

        if (error) throw error;
        setVlanSchemas(data || []);
      } catch (error) {
        console.error("Error fetching VLAN schemas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVlanSchemas();
  }, []);

  return { vlanSchemas, loading };
}

// Parse IP address to numeric value for comparison
function ipToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

// Convert numeric value back to IP address
function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join(".");
}

// Check if an IP is within a subnet
function isIpInSubnet(ip: string, subnet: string): boolean {
  const [subnetIp, maskBits] = subnet.split("/");
  const mask = ~((1 << (32 - parseInt(maskBits))) - 1) >>> 0;
  const subnetNum = ipToNumber(subnetIp);
  const ipNum = ipToNumber(ip);
  return (ipNum & mask) === (subnetNum & mask);
}

// Calculate the next available IP in a VLAN
export function calculateNextAvailableIp(
  vlanSchema: VlanSchema,
  existingDevices: { ip_address: string; vlan_id: number | null }[]
): string {
  // Filter devices that belong to this VLAN
  const devicesInVlan = existingDevices.filter(
    (d) => d.vlan_id === vlanSchema.vlan_id && isIpInSubnet(d.ip_address, vlanSchema.subnet)
  );

  if (devicesInVlan.length === 0) {
    // No devices in this VLAN, return range_start
    return vlanSchema.range_start;
  }

  // Find the highest IP address
  const ipNumbers = devicesInVlan.map((d) => ipToNumber(d.ip_address));
  const maxIp = Math.max(...ipNumbers);

  // Calculate subnet broadcast address to avoid going over
  const [subnetIp, maskBits] = vlanSchema.subnet.split("/");
  const hostBits = 32 - parseInt(maskBits);
  const networkNum = ipToNumber(subnetIp);
  const broadcastNum = networkNum + ((1 << hostBits) - 1);

  // Next IP is max + 1, but don't exceed broadcast - 1
  const nextIp = maxIp + 1;
  if (nextIp >= broadcastNum) {
    // Subnet is full, return range_start as fallback
    return vlanSchema.range_start;
  }

  return numberToIp(nextIp);
}
