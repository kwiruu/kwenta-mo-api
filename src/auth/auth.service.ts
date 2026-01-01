import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseService } from "./supabase.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService
  ) {}

  // Sync user from Supabase Auth to our database
  async syncUser(supabaseUserId: string, email: string, name?: string) {
    return this.prisma.user.upsert({
      where: { id: supabaseUserId },
      update: { email, name },
      create: {
        id: supabaseUserId,
        email,
        name,
      },
    });
  }

  // Get user by Supabase ID
  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { business: true },
    });
  }

  // Check if user exists
  async userExists(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return !!user;
  }
}
