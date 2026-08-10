import { useEffect, useState } from 'react';
import { getContext } from '@microsoft/power-apps/app';

interface CurrentUser {
  fullName: string;
  userPrincipalName: string;
}

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    getContext()
      .then((ctx) => {
        setUser({
          fullName: ctx.user.fullName ?? ctx.user.userPrincipalName ?? 'Signed-in user',
          userPrincipalName: ctx.user.userPrincipalName ?? '',
        });
      })
      .catch(() => {
        // Host context isn't available outside the Power Apps player (e.g. bare `vite dev`) — leave user null.
      });
  }, []);

  return user;
}
