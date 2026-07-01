// Backend/config/passport.js
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcryptjs";
import User from "../models/user.js";

// Hardcoded environment variables
const env = {
  GOOGLE_CLIENT_ID: "234761518387-qr98oluu0u9p2ud9m53r3n8oh5t2q723.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "GOCSPX-KK466t-xxxxxxxxxxxx",
  GOOGLE_CALLBACK_URL: "http://localhost:4000/auth/google/callback"
};

passport.serializeUser((user, done) => {
  console.log("Serializing user:", user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("Deserializing user ID:", id);
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error("Deserialize error:", error);
    done(error, null);
  }
});

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        console.log("LocalStrategy: Finding user with email:", email);
        const user = await User.findOne({ email });
        if (!user) {
          console.log("LocalStrategy: User not found for email:", email);
          return done(null, false, { message: "Invalid email or password" });
        }
        console.log("LocalStrategy: User found:", { email: user.email, password: user.password });
        if (!user.password) {
          console.log("LocalStrategy: No password set for user:", email);
          return done(null, false, { message: "No password set for this account" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("LocalStrategy: Password match result:", isMatch, "Input password:", password);
        if (!isMatch) {
          console.log("LocalStrategy: Password mismatch for email:", email);
          return done(null, false, { message: "Invalid email or password" });
        }
        if (user.status !== "active") {
          console.log("LocalStrategy: Account not active for email:", email);
          return done(null, false, { message: "Account not active" });
        }
        console.log("LocalStrategy: Login successful for email:", email);
        return done(null, user);
      } catch (error) {
        console.error("LocalStrategy error:", error);
        return done(error);
      }
      
    }
  )
);


passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("GoogleStrategy: Processing profile:", profile.emails[0].value);
        let user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          if (user.status !== "active") {
            console.log("GoogleStrategy: Account not active for email:", profile.emails[0].value);
            return done(null, false, { message: "Account not active" });
          }
          console.log("GoogleStrategy: User found:", profile.emails[0].value);
          return done(null, user);
        }
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          type: "module",
          role: "patient",
          status: "pending",
        });
        await user.save();
        console.log("GoogleStrategy: New user created:", profile.emails[0].value);
        return done(null, user);
      } catch (error) {
        console.error("GoogleStrategy error:", error);
        return done(error);
      }
    }
  )
);

console.log("Passport strategies registered:", Object.keys(passport._strategies));
export default passport;