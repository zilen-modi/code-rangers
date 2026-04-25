import { Role } from '@prisma/client';
import { prisma } from '../db';

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: { email: string; passwordHash: string; role: Role }) {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.passwordHash,
        role: data.role,
      },
    });
  }
}
