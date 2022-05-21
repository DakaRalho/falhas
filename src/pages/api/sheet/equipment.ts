import type { NextApiRequest } from 'next';
import database from '../../../utils/database';
import { sessionAPI } from '../../../utils/session';
import type { NextApiResponseServerIO } from '../../../utils/socket';

function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
	if (req.method === 'POST') return handlePost(req, res);
	if (req.method === 'PUT') return handlePut(req, res);
	if (req.method === 'DELETE') return handleDelete(req, res);
	res.status(404).end();
}

async function handlePost(req: NextApiRequest, res: NextApiResponseServerIO) {
	const player = req.session.player;

	if (!player || !player.admin) {
		res.status(401).end();
		return;
	}

	const id = req.body.id;
	const name = req.body.name;
	const type = req.body.type;
	const damage = req.body.damage;
	const range = req.body.range;
	const attacks = req.body.attacks;
	const ammo = req.body.ammo;
	const visible = req.body.visible;

	if (!id) {
		res.status(400).send({ message: 'Info ID is undefined.' });
		return;
	}

	const eq = await database.equipment.update({
		where: { id },
		data: { name, ammo, attacks, damage, range, type, visible },
	});

	res.end();

	
	res.socket.server.io?.emit('equipmentChange', eq);
}

async function handlePut(req: NextApiRequest, res: NextApiResponseServerIO) {
	const player = req.session.player;

	if (!player || !player.admin) {
		res.status(401).end();
		return;
	}

	const name = req.body.name;
	const ammo = req.body.ammo;
	const attacks = req.body.attacks;
	const damage = req.body.damage;
	const range = req.body.range;
	const type = req.body.type;

	if (
		name === undefined ||
		ammo === undefined ||
		attacks === undefined ||
		damage === undefined ||
		range === undefined ||
		type === undefined
	) {
		res.status(400).send({ message: 'Name or rollable is undefined.' });
		return;
	}

	const eq = await database.equipment.create({
		data: { name, ammo, attacks, damage, range, type, visible: true },
	});

	res.send({ id: eq.id });

	res.socket.server.io?.emit('equipmentAdd', eq.id, eq.name);
}

async function handleDelete(req: NextApiRequest, res: NextApiResponseServerIO) {
	const player = req.session.player;

	if (!player || !player.admin) {
		res.status(401).end();
		return;
	}

	const id = req.body.id;

	if (!id) {
		res.status(401).send({ message: 'ID is undefined.' });
		return;
	}

	await database.equipment.delete({ where: { id } });

	res.end();

	res.socket.server.io?.emit('equipmentRemove', id);
}

export default sessionAPI(handler);
