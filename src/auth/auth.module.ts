import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SupabaseService } from "./supabase.service";
import { SupabaseAuthGuard } from "./supabase-auth.guard";

@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseService, SupabaseAuthGuard],
  exports: [AuthService, SupabaseService, SupabaseAuthGuard],
})
export class AuthModule {}
