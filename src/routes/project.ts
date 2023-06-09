import { Router } from 'express';
import { getData } from '../data/data';
import { getUserById } from '../data/users';
import HttpError from 'http-errors';
import { ProjectId } from '../types/project';
import { v4 as uuid } from 'uuid';
import { deleteProject, getProjectById, getVisibleProjects, isProjectVisibleToUser } from '../data/projects';
import { getUserIdFromRequest, getUserIdFromRequest as userFromToken } from '../util/token';

const project = Router();

project.post('/', (req, res) => {
  const owner = getUserIdFromRequest(req);

  const {
    name,
    description,
  }: { name: string, description: string } = req.body;

  if (!getUserById(owner)) {
    throw HttpError(400, 'Bad user id');
  }

  // Generate project ID
  const id = uuid() as ProjectId;

  getData().projects[id] = {
    id,
    name,
    description,
    owner,
  };

  res.json({ id });
});

project.get('/', (req, res) => {
  const id = userFromToken(req);
  res.json({ projects: getVisibleProjects(id) });
});

project.get('/:projectId', (req, res) => {
  const id = userFromToken(req);
  const projectId = req.params.projectId as ProjectId;

  const project = getProjectById(projectId);

  if (project === null) {
    throw HttpError(400, 'Project does not exist');
  }

  if (!isProjectVisibleToUser(id, projectId)) {
    throw HttpError(403, 'Unable to view project');
  }

  res.json(project);
});

project.put('/:projectId', (req, res) => {
  const id = userFromToken(req);
  const projectId = req.params.projectId as ProjectId;

  const project = getProjectById(projectId);

  if (project === null) {
    throw HttpError(400, 'Project does not exist');
  }

  if (project.owner !== id) {
    throw HttpError(403, "You're not the owner of the project");
  }

  const { name, description } = req.body as { name: string, description: string };

  project.name = name;
  project.description = description;

  res.json({});
});

project.delete('/:projectId', (req, res) => {
  const id = userFromToken(req);
  const projectId = req.params.projectId as ProjectId;

  const project = getProjectById(projectId);

  if (project === null) {
    throw HttpError(400, 'Project does not exist');
  }

  if (project.owner !== id) {
    throw HttpError(403, "You're not the owner of the project");
  }

  deleteProject(projectId);

  res.json({});
});

export default project;