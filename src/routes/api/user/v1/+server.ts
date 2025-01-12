import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

import { ApiError, HttpStatus } from '$lib/server/api.error';
import { ensureUser, genPat, requestBody } from '$lib/server/handlers/helper';
import { wrap } from '$lib/server/handlers/wrap';
import { user as userSvc } from '$lib/server/services/user.service';

export const GET: RequestHandler = async (event) => {
  return wrap(event, async (event) => {
    const userId = ensureUser(event).userId;
    const user0 = userSvc.getUserByIdWithHydratedFeature({ id: userId });
    const { token } = await genPat({ id: user0.id, username: user0.username, feature: user0.feature });
    const { password, ...userRestProps } = user0;
    const user = { ...userRestProps, passwordless: password ? false : true };
    return json({ token, user });
  });
};

// {op:'changePassword',data:{currentPassword:'',newPassword:''}}
export const POST: RequestHandler = async (event) => {
  return wrap(event, async (event) => {
    const user = ensureUser(event);
    const body = await requestBody(event);
    const op = body.op;
    if (op !== 'changePassword') {
      throw new ApiError(HttpStatus.BAD_REQUEST);
    }
    const data = body.data;
    if (typeof data.currentPassword !== 'string' || data.currentPassword === '') {
      throw new ApiError(HttpStatus.BAD_REQUEST);
    }
    if (typeof data.newPassword !== 'string' || data.newPassword === '') {
      throw new ApiError(HttpStatus.BAD_REQUEST);
    }
    await userSvc.changePassword({ ...data, userId: user.userId });
    return new Response(undefined, { status: HttpStatus.NO_CONTENT });
  });
};
