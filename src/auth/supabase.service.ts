import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL");
    const supabaseAnonKey = this.configService.get<string>("SUPABASE_ANON_KEY");
    const supabaseServiceKey = this.configService.get<string>(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    // Client for regular operations
    this.supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    // Admin client for privileged operations
    this.supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    return this.supabaseAdmin;
  }

  // Verify JWT token
  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error) {
      throw error;
    }
    return data.user;
  }

  // Upload file to storage
  async uploadFile(
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string
  ) {
    const { data, error } = await this.supabaseAdmin.storage
      .from(bucket)
      .upload(path, file, { contentType });

    if (error) throw error;
    return data;
  }

  // Get public URL for a file
  getPublicUrl(bucket: string, path: string) {
    const { data } = this.supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // Delete file from storage
  async deleteFile(bucket: string, paths: string[]) {
    const { error } = await this.supabaseAdmin.storage
      .from(bucket)
      .remove(paths);
    if (error) throw error;
  }
}
