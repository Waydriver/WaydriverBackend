import { Response, Router } from 'express';
import { getData, saveData } from '../data/data';
import { getUserByUsername } from '../data/users';
import HttpError from 'http-errors';
import { UserId } from '../types/user';
import { body, validationResult } from 'express-validator';
import { Request as JWTRequest } from 'express-jwt';
import { Request } from 'express-validator/src/base';
import { v4 as uuid } from 'uuid';
import { generateToken, revokeToken } from '../util/token';

const auth = Router();

auth.post(
  '/register',
  [
    body('username')
      .exists()
      .escape()
      .isAlphanumeric()
      .isLowercase()
      .custom(async username => {
        const u = getUserByUsername(username);
        if (u !== null) {
          throw new Error('Username already exists');
        }
      }),
    body('displayName')
      .exists()
      .escape()
      .isString(),
    body('password')
      .exists()
      .isStrongPassword(),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    const {
      username,
      displayName,
      password,
    }: { username: string, displayName: string, password: string } = req.body;

    // Generate user ID
    const id = uuid() as UserId;

    getData().users[id] = {
      id,
      username,
      displayName,
      password,
      sessions: [],
    };

    res.json({ id, token: generateToken(id) });

    saveData();
  }
);

auth.post(
  '/login',
  [
    body('username').exists(),
    body('password').exists(),
  ],
  (req: Request, res: Response) => {
    const { username, password }: { username: string, password: string } = req.body;

    const u = getUserByUsername(username);
    if (u === null) {
      throw HttpError(400, 'Username not found');
    }

    if (u.password !== password) {
      throw HttpError(400, 'Password is incorrect');
    }

    res.json({ id: u.id, token: generateToken(u.id) });

    saveData();
  });

auth.post(
  '/logout',
  (req: JWTRequest, res: Response) => {
    revokeToken(req);
    res.json({});
  }
)

export default auth;
