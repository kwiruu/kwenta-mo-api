import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { SupabaseAuthGuard } from "./supabase-auth.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  // Sync user after login/registration (called from frontend)
  @Post("sync")
  @UseGuards(SupabaseAuthGuard)
  async syncUser(@Request() req: any, @Body() body: { name?: string }) {
    const user = await this.authService.syncUser(
      req.user.id,
      req.user.email,
      body.name
    );
    return { success: true, user };
  }

  // Get current user profile
  @Get("me")
  @UseGuards(SupabaseAuthGuard)
  async getCurrentUser(@Request() req: any) {
    const user = await this.authService.getUserById(req.user.id);
    if (!user) {
      return { exists: false };
    }
    return { exists: true, user };
  }
}
