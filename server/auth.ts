
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { Express } from "express";
import { log } from "./vite";
import bcrypt from "bcryptjs";

// User type definition
type User = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName?: string;
};

// In-memory user store (replace with database in production)
const users: Record<string, User> = {};

// Pre-create some test users
users["1"] = {
  id: "1",
  username: "demo",
  email: "demo@example.com",
  passwordHash: bcrypt.hashSync("password", 10),
  displayName: "Demo User"
};

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
  done(null, users[id] || null);
});

export function setupAuth(app: Express) {
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      (email, password, done) => {
        // Find user by email
        const userEntry = Object.values(users).find(user => user.email === email);
        
        if (!userEntry) {
          return done(null, false, { message: "Incorrect email." });
        }
        
        // Check password
        if (!bcrypt.compareSync(password, userEntry.passwordHash)) {
          return done(null, false, { message: "Incorrect password." });
        }
        
        log(`User authenticated: ${userEntry.email}`);
        return done(null, userEntry);
      }
    )
  );

  // Auth routes
  app.post("/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  app.post("/auth/register", (req, res) => {
    const { email, password, username } = req.body;
    
    // Check if user already exists
    if (Object.values(users).some(user => user.email === email)) {
      return res.status(400).json({ message: "Email already in use." });
    }
    
    // Create new user
    const id = Date.now().toString();
    const newUser: User = {
      id,
      username,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      displayName: username
    };
    
    users[id] = newUser;
    
    // Auto-login after registration
    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging in after registration." });
      }
      return res.json({ success: true, user: newUser });
    });
  });

  app.get("/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Error during logout" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Error destroying session" });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Logged out successfully" });
      });
    });
  });

  // User info endpoint
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as User;
      // Don't send password hash to client
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } else {
      res.status(401).json({ authenticated: false });
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}
