import { Token } from '../../src/types/user';
import api from '../api';
import { makeUser } from '../helpers';

beforeEach(api.debug.clear);

describe('/project POST', () => {
  it('allows users to create projects', async () => {
    const { token } = await makeUser();
    const result = await api.project.create(
      token,
      'My project',
      'A test project',
    );
    expect(result).toStrictEqual({ id: expect.any(String) });
    await expect(api.project.details(token, result.id)).toResolve();
  });

  it("doesn't allow users with invalid tokens to create projects", async () => {
    await expect(
      api.project.create('bad' as Token, 'proj', 'desc')
    ).rejects.toMatchObject({ code: 401 });
  });

  it("doesn't allow empty project names", async () => {
    const { token } = await makeUser();
    await expect(
      api.project.create(token, '', 'A test project')
    ).rejects.toMatchObject({ code: 400 });
  });

  it("doesn't allow whitespace-only project names", async () => {
    const { token } = await makeUser();
    await expect(
      api.project.create(token, ' \t', 'A test project')
    ).rejects.toMatchObject({ code: 400 });
  });

  it('does allow empty project descriptions', async () => {
    const { token } = await makeUser();
    await api.project.create(token, 'My project', '');
  });
});
