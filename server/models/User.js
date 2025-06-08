import bcrypt from 'bcryptjs';
import { dbGet, dbRun } from '../database/database.js';

export class User {
  constructor(id, name, email, password, created_at) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.created_at = created_at;
  }

  // Create a new user
  static async create(name, email, password) {
    try {
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Insert user into database
      const result = await dbRun(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword]
      );
      
      // Return user without password
      return {
        id: result.id,
        name,
        email,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
      return user ? new User(user.id, user.name, user.email, user.password, user.created_at) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const user = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
      return user ? new User(user.id, user.name, user.email, user.password, user.created_at) : null;
    } catch (error) {
      throw error;
    }
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Return user data without password
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      created_at: this.created_at
    };
  }
}

export default User;