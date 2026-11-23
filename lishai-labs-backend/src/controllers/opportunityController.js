import OpportunityModel from '../models/opportunityModel.js';

const ALLOWED_STATUSES = ['draft', 'published', 'closed', 'archived'];

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseApplicationLimit(rawValue) {
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    return { value: null };
  }
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return { error: 'Application limit must be a whole number of at least 1.' };
  }
  return { value: parsed };
}

export async function listOpportunities(req, res) {
  try {
    const { status, limit, offset } = req.query;
    const data = await OpportunityModel.findAll({ status, limit, offset });
    return res.json(data);
  } catch (error) {
    console.error('listOpportunities error:', error);
    return res.status(500).json({ message: 'Unable to load opportunities.' });
  }
}

export async function getOpportunity(req, res) {
  try {
    const opportunity = await OpportunityModel.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found.' });
    }
    return res.json(opportunity);
  } catch (error) {
    console.error('getOpportunity error:', error);
    return res.status(500).json({ message: 'Unable to load opportunity.' });
  }
}

export async function createOpportunity(req, res) {
  try {
    const {
      title,
      slug,
      description = '',
      location = '',
      type = 'General',
      image = '',
      status = 'draft',
      application_limit,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Title is required.' });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid opportunity status.' });
    }

    const limitCheck = parseApplicationLimit(application_limit);
    if (limitCheck.error) {
      return res.status(400).json({ message: limitCheck.error });
    }

    const normalizedSlug = slug && String(slug).trim()
      ? slugify(slug)
      : `${slugify(title)}-${Date.now().toString(36)}`;

    const created = await OpportunityModel.create({
      title: String(title).trim(),
      slug: normalizedSlug,
      description: String(description || ''),
      location: String(location || '').trim(),
      type: String(type || 'General').trim(),
      image: String(image || '').trim(),
      status,
      application_limit: limitCheck.value,
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error('createOpportunity error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An opportunity with that slug already exists.' });
    }
    return res.status(500).json({ message: 'Unable to create opportunity.' });
  }
}

export async function updateOpportunity(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      description = '',
      location = '',
      type = 'General',
      image = '',
      status = 'draft',
      application_limit,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Title is required.' });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid opportunity status.' });
    }

    const limitCheck = parseApplicationLimit(application_limit);
    if (limitCheck.error) {
      return res.status(400).json({ message: limitCheck.error });
    }

    const normalizedSlug = slug && String(slug).trim() ? slugify(slug) : slugify(title);

    const updated = await OpportunityModel.update(id, {
      title: String(title).trim(),
      slug: normalizedSlug,
      description: String(description || ''),
      location: String(location || '').trim(),
      type: String(type || 'General').trim(),
      image: String(image || '').trim(),
      status,
      application_limit: limitCheck.value,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Opportunity not found.' });
    }

    return res.json(updated);
  } catch (error) {
    console.error('updateOpportunity error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An opportunity with that slug already exists.' });
    }
    return res.status(500).json({ message: 'Unable to update opportunity.' });
  }
}

export async function deleteOpportunity(req, res) {
  try {
    const deleted = await OpportunityModel.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Opportunity not found.' });
    }
    return res.json({ message: 'Opportunity deleted successfully.' });
  } catch (error) {
    console.error('deleteOpportunity error:', error);
    return res.status(500).json({ message: 'Unable to delete opportunity.' });
  }
}