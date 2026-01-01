import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { SupabaseService } from "./supabase.service";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const user = await this.supabaseService.verifyToken(token);

      // Attach user to request for use in controllers
      request.user = {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at !== null,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
