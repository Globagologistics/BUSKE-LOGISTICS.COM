export interface User {
  id: string;
  email: string;
  user_type: 'admin' | 'sender' | 'receiver';
  full_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Checkpoint {
  id: string;
  shipment_id: string;
  location: string;
  checkpoint_order: number;
  status: 'pending' | 'current' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  admin_id: string;
  sender_name: string;
  sender_phone: string;
  sender_email?: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_email?: string;
  pickup_location?: string;
  delivery_address: string;
  warehouse?: string;
  transportation: string;
  package_name?: string;
  cost?: number;
  paid: boolean;
  vehicles_count?: number;
  vehicle_type?: string;
  driver_name?: string;
  driver_experience?: string;
  driver_image_url?: string;
  route_screenshot_url?: string;
  
  // Countdown Timer Fields (stored in seconds)
  countdown_duration?: number; // seconds until arrival
  countdown_start_time?: string;
  
  // Image URLs uploaded separately to storage
  images?: string[];
  
  // Pause/Resume Fields
  paused: boolean;
  pause_timestamp?: string;
  
  // Stop Fields
  stopped: boolean;
  stop_reason?: string;
  
  // Tracking
  current_checkpoint_index: number;
  status: 'in_transit' | 'paused' | 'stopped' | 'delivered';
  
  created_at: string;
  updated_at: string;
}

export interface ShipmentWithCheckpoints extends Shipment {
  checkpoints: Checkpoint[];
}
