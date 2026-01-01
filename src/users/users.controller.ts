import { Controller, Get, Put, Body, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { UpdateBusinessDto } from "./dto/update-business.dto";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("profile")
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put("business")
  async updateBusiness(@Request() req: any, @Body() dto: UpdateBusinessDto) {
    return this.usersService.updateBusiness(req.user.id, dto);
  }
}
