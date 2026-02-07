import jwt, { SignOptions } from "jsonwebtoken"; // Import SignOptions

export const generateAccessToken = (userId: string, email: string, tokenVersion: number): string => {
  return jwt.sign(
    { userId, email, tokenVersion },
    process.env.ACCESS_TOKEN_SECRET as string,
    { 
      // Casting to the specific expected type instead of 'any'
      expiresIn: (process.env.ACCESS_TOKEN_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn']
    }
  );
};

export const generateRefreshToken = (
  userId: string,
  tokenVersion: number
): string => {
  return jwt.sign(
    { userId, tokenVersion },
    process.env.REFRESH_TOKEN_SECRET as string,
    { 
      expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
    }
  );
};
