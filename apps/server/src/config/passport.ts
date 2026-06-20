import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";
import { env } from "./env";
import { User } from "../models/User";

let configured = false;

export const configurePassport = () => {
  if (configured) {
    return passport;
  }

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await User.findOne({ username: username.toLowerCase() }).select("+password");
        if (!user) {
          return done(null, false, { message: "Usuário ou senha inválidos." });
        }

        const matches = await user.comparePassword(password);
        if (!matches) {
          return done(null, false, { message: "Usuário ou senha inválidos." });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    })
  );

  passport.use(
    new JwtStrategy(
      {
        secretOrKey: env.jwtSecret,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
      },
      async (payload, done) => {
        try {
          const user = await User.findById(payload.sub);
          if (!user) {
            return done(null, false);
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, false);
        }
      }
    )
  );

  configured = true;
  return passport;
};
