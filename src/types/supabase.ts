import type { CommunicationMode, LeadStatus, MessageEventType, OpportunityLevel, ProposalStatus, ResponseStatus, WhatsAppMessageDirection } from "@/types/database";

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
};

type LeadRow = {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  niche: string | null;
  city: string | null;
  state: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  current_site: string | null;
  notes: string | null;
  whatsapp_opt_in: boolean;
  auto_message_enabled: boolean;
  response_status: ResponseStatus;
  status: LeadStatus;
  opportunity: OpportunityLevel;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  generated_message: string | null;
  last_whatsapp_sent_at: string | null;
  last_inbound_message: string | null;
  last_inbound_at: string | null;
  external_source: string | null;
  external_id: string | null;
  source_url: string | null;
  opportunity_score: number;
  signal_no_site: boolean;
  signal_old_site: boolean;
  signal_slow_site: boolean;
  signal_not_responsive: boolean;
  signal_no_https: boolean;
  signal_only_instagram: boolean;
  signal_has_whatsapp: boolean;
  signal_good_presence: boolean;
  signal_weak_presence: boolean;
  signal_good_reviews: boolean;
  signal_competitive_region: boolean;
  signal_good_client: boolean;
  signal_high_closing_chance: boolean;
  created_at: string;
  updated_at: string;
};

type ProposalRow = {
  id: string;
  user_id: string;
  lead_id: string;
  amount: number;
  service_offered: string;
  deadline: string | null;
  scope: string | null;
  benefits: string | null;
  conditions: string | null;
  status: ProposalStatus;
  notes: string | null;
  created_at: string;
};

type FollowUpRow = {
  id: string;
  user_id: string;
  lead_id: string;
  due_date: string;
  note: string | null;
  completed: boolean;
  created_at: string;
};

type MessageTemplateRow = {
  id: string;
  user_id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type WhatsAppMessageRow = {
  id: string;
  user_id: string | null;
  lead_id: string | null;
  phone: string;
  direction: WhatsAppMessageDirection;
  event_type: MessageEventType;
  communication_mode: CommunicationMode;
  body: string;
  provider_message_id: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<UserRow, "id" | "created_at">>;
        Relationships: [];
      };
      leads: {
        Row: LeadRow;
        Insert: Partial<LeadRow> & {
          user_id: string;
          company_name: string;
        };
        Update: Partial<LeadRow>;
        Relationships: [
          {
            foreignKeyName: "leads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      proposals: {
        Row: ProposalRow;
        Insert: Partial<ProposalRow> & {
          user_id: string;
          lead_id: string;
          amount: number;
          service_offered: string;
        };
        Update: Partial<ProposalRow>;
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      follow_ups: {
        Row: FollowUpRow;
        Insert: Partial<FollowUpRow> & {
          user_id: string;
          lead_id: string;
          due_date: string;
        };
        Update: Partial<FollowUpRow>;
        Relationships: [
          {
            foreignKeyName: "follow_ups_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follow_ups_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      message_templates: {
        Row: MessageTemplateRow;
        Insert: Partial<MessageTemplateRow> & {
          user_id: string;
          name: string;
          content: string;
        };
        Update: Partial<MessageTemplateRow>;
        Relationships: [
          {
            foreignKeyName: "message_templates_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      whatsapp_messages: {
        Row: WhatsAppMessageRow;
        Insert: Partial<WhatsAppMessageRow> & {
          phone: string;
          direction: WhatsAppMessageDirection;
          body: string;
        };
        Update: Partial<WhatsAppMessageRow>;
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whatsapp_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      lead_status: LeadStatus;
      opportunity_level: OpportunityLevel;
      proposal_status: ProposalStatus;
    };
    CompositeTypes: {};
  };
};
