import { beforeEach, describe, expect, it, mock } from 'bun:test';

// ---------------------------------------------------------------------------
// Module mocks — must be set up before any dynamic import of the actions file
// ---------------------------------------------------------------------------

const mockGetSession = mock(() => Promise.resolve(null));
const mockGetShelterByEmail = mock(() => Promise.resolve(null));
const mockGetShelterById = mock(() => Promise.resolve(null));
const mockUpdateShelter = mock(() =>
  Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
);
const mockDeleteShelter = mock(() => Promise.resolve());
const mockVerifyPassword = mock(() => Promise.resolve(true));
const mockHashPassword = mock(() => Promise.resolve('$2b$10$hashed'));
const mockRevalidatePath = mock(() => {});

let redirectTarget = '';
const mockRedirect = mock((path: string) => {
  redirectTarget = path;
  // Next.js redirect throws internally; simulate that
  throw new Error(`NEXT_REDIRECT:${path}`);
});

beforeEach(() => {
  redirectTarget = '';
  mockGetSession.mockReset();
  mockGetShelterByEmail.mockReset();
  mockGetShelterById.mockReset();
  mockUpdateShelter.mockReset();
  mockDeleteShelter.mockReset();
  mockVerifyPassword.mockReset();
  mockHashPassword.mockReset();
  mockRedirect.mockReset();
  mockRevalidatePath.mockReset();

  // Default: logged-in session
  mockGetSession.mockImplementation(() =>
    Promise.resolve({ shelterId: '11111111-1111-1111-1111-111111111111' }),
  );

  // Default shelter returned by getShelterById
  mockGetShelterById.mockImplementation(() =>
    Promise.resolve({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Schronisko Warszawa',
      city: 'warszawa',
      email: 'warszawa@example.com',
      password_hash: '$2b$10$K7L1OJ45',
      created_at: null,
    }),
  );

  mockVerifyPassword.mockImplementation(() => Promise.resolve(true));
  mockHashPassword.mockImplementation(() => Promise.resolve('$2b$10$hashed'));
  mockUpdateShelter.mockImplementation(() =>
    Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
  );
  mockDeleteShelter.mockImplementation(() => Promise.resolve());
  mockGetShelterByEmail.mockImplementation(() => Promise.resolve(null));

  mockRedirect.mockImplementation((path: string) => {
    redirectTarget = path;
    throw new Error(`NEXT_REDIRECT:${path}`);
  });

  mock.module('next/navigation', () => ({
    redirect: mockRedirect,
    notFound: mock(() => {
      throw new Error('NEXT_NOT_FOUND');
    }),
  }));
  mock.module('next/cache', () => ({
    revalidatePath: mockRevalidatePath,
    unstable_noStore: mock(() => {}),
  }));
  mock.module('@/lib/auth/session', () => ({
    getSession: mockGetSession,
    createSession: mock(() => Promise.resolve()),
    deleteSession: mock(() => Promise.resolve()),
  }));
  mock.module('@/lib/auth/password', () => ({
    verifyPassword: mockVerifyPassword,
    hashPassword: mockHashPassword,
  }));
  mock.module('@/db/client', () => ({
    createServerClient: () => ({ mocked: true }),
  }));
  mock.module('@/db/queries/shelters', () => ({
    createShelter: mock(() => Promise.resolve()),
    getSheltersByCity: mock(() => Promise.resolve([])),
    getShelterByEmail: mockGetShelterByEmail,
    getShelterById: mockGetShelterById,
    updateShelter: mockUpdateShelter,
    deleteShelter: mockDeleteShelter,
  }));
});

const describeUnit = describe;

describeUnit('updateShelterAction', () => {
  it('redirects to /login when no session', async () => {
    mockGetSession.mockImplementation(() => Promise.resolve(null));
    const { updateShelterAction } = await import('@/app/actions/auth');

    const fd = new FormData();
    fd.set('name', 'Nowa Nazwa');
    fd.set('city', 'Warszawa');
    fd.set('email', 'warszawa@example.com');
    fd.set('current_password', 'password123');

    await expect(updateShelterAction({}, fd)).rejects.toThrow(
      'NEXT_REDIRECT:/login',
    );
  });

  it('returns error when required fields are missing', async () => {
    const { updateShelterAction } = await import('@/app/actions/auth');

    const fd = new FormData();
    fd.set('name', '');
    fd.set('city', 'Warszawa');
    fd.set('email', 'warszawa@example.com');
    fd.set('current_password', 'password123');

    const result = await updateShelterAction({}, fd);
    expect(result.error).toBeTruthy();
    expect(mockUpdateShelter).not.toHaveBeenCalled();
  });

  it('returns error when current password is wrong', async () => {
    mockVerifyPassword.mockImplementation(() => Promise.resolve(false));
    const { updateShelterAction } = await import('@/app/actions/auth');

    const fd = new FormData();
    fd.set('name', 'Nowa Nazwa');
    fd.set('city', 'Krakow');
    fd.set('email', 'warszawa@example.com');
    fd.set('current_password', 'wrong');

    const result = await updateShelterAction({}, fd);
    expect(result.error).toContain('nieprawidłowe');
    expect(mockUpdateShelter).not.toHaveBeenCalled();
  });

  it('returns error when new email is already taken', async () => {
    mockGetShelterByEmail.mockImplementation(() =>
      Promise.resolve({ id: 'other-id', email: 'taken@example.com' }),
    );
    const { updateShelterAction } = await import('@/app/actions/auth');

    const fd = new FormData();
    fd.set('name', 'Nowa Nazwa');
    fd.set('city', 'Warszawa');
    fd.set('email', 'taken@example.com');
    fd.set('current_password', 'password123');

    const result = await updateShelterAction({}, fd);
    expect(result.error).toContain('zajęty');
    expect(mockUpdateShelter).not.toHaveBeenCalled();
  });

  it('returns error when new password is too short', async () => {
    const { updateShelterAction } = await import('@/app/actions/auth');

    const fd = new FormData();
    fd.set('name', 'Nowa Nazwa');
    fd.set('city', 'Warszawa');
    fd.set('email', 'warszawa@example.com');
    fd.set('password', 'short');
    fd.set('current_password', 'password123');

    const result = await updateShelterAction({}, fd);
    expect(result.error).toContain('8 znaków');
    expect(mockUpdateShelter).not.toHaveBeenCalled();
  });

  it('updates shelter with hashed new password when provided', async () => {
    const { updateShelterAction } = await import('@/app/actions/auth');

    const fd = new FormData();
    fd.set('name', 'Zmieniona Nazwa');
    fd.set('city', 'Krakow');
    fd.set('email', 'warszawa@example.com');
    fd.set('password', 'nowehaslo123');
    fd.set('current_password', 'password123');

    const result = await updateShelterAction({}, fd);
    expect(result.success).toBe(true);
    expect(mockHashPassword).toHaveBeenCalledWith('nowehaslo123');
    expect(mockUpdateShelter).toHaveBeenCalledWith(
      expect.anything(),
      '11111111-1111-1111-1111-111111111111',
      expect.objectContaining({ password_hash: '$2b$10$hashed' }),
    );
  });

  it('updates shelter without changing password when field is empty', async () => {
    const { updateShelterAction } = await import('@/app/actions/auth');

    const fd = new FormData();
    fd.set('name', 'Zmieniona Nazwa');
    fd.set('city', 'Krakow');
    fd.set('email', 'warszawa@example.com');
    fd.set('password', '');
    fd.set('current_password', 'password123');

    const result = await updateShelterAction({}, fd);
    expect(result.success).toBe(true);
    expect(mockHashPassword).not.toHaveBeenCalled();
    const call = mockUpdateShelter.mock.calls[0];
    expect(call?.[2]).not.toHaveProperty('password_hash');
  });

  it('revalidates /dashboard on success', async () => {
    const { updateShelterAction } = await import('@/app/actions/auth');

    const fd = new FormData();
    fd.set('name', 'Nazwa');
    fd.set('city', 'Warszawa');
    fd.set('email', 'warszawa@example.com');
    fd.set('current_password', 'password123');

    await updateShelterAction({}, fd);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

describeUnit('deleteShelterAction', () => {
  it('redirects to /login when no session', async () => {
    mockGetSession.mockImplementation(() => Promise.resolve(null));
    const { deleteShelterAction } = await import('@/app/actions/auth');

    const fd = new FormData();
    fd.set('current_password', 'password123');

    await expect(deleteShelterAction(fd)).rejects.toThrow(
      'NEXT_REDIRECT:/login',
    );
  });

  it('redirects to /dashboard with error param when password is wrong', async () => {
    mockVerifyPassword.mockImplementation(() => Promise.resolve(false));
    const { deleteShelterAction } = await import('@/app/actions/auth');

    const fd = new FormData();
    fd.set('current_password', 'wrong');

    await expect(deleteShelterAction(fd)).rejects.toThrow(
      'NEXT_REDIRECT:/dashboard?delete_error=bad_password',
    );
    expect(mockDeleteShelter).not.toHaveBeenCalled();
  });

  it('deletes shelter and redirects to / on success', async () => {
    const { deleteShelterAction } = await import('@/app/actions/auth');

    const fd = new FormData();
    fd.set('current_password', 'password123');

    await expect(deleteShelterAction(fd)).rejects.toThrow('NEXT_REDIRECT:/');
    expect(mockDeleteShelter).toHaveBeenCalledWith(
      expect.anything(),
      '11111111-1111-1111-1111-111111111111',
    );
  });
});
