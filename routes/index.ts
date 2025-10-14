import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { exampleApiService } from '#src/services/exampleApiService.js';

// Create a new router
const router = express.Router();
const SUCCESSFUL_REQUEST = 200;
const UNSUCCESSFUL_REQUEST = 500;

/* GET home page. */
router.get('/', function (req: Request, res: Response): void {
	res.render('main/index');
});

// GET users from external API using BaseApiService pattern
router.get('/users', async function (req: Request, res: Response, next: NextFunction) {
	try {
		// Use the BaseApiService - returns raw axios response (no domain transformation)
		const response = await exampleApiService.getUsers(req.axiosMiddleware, {
			_page: typeof req.query.page === 'string' ? req.query.page : '1',
			_limit: typeof req.query.limit === 'string' ? req.query.limit : '10'
		});

		// Template users add their own response handling here
		res.json(response.data);
	} catch (error) {
		next(error);
	}
});

// GET single user by ID (demonstrates BaseApiService pattern)
router.get('/users/:id', async function (req: Request, res: Response, next: NextFunction) {
	try {
		const response = await exampleApiService.getUserById(req.axiosMiddleware, req.params.id);

		// Template users add their own response handling here
		res.json(response.data);
	} catch (error) {
		next(error);
	}
});

// liveness and readiness probes for Helm deployments
router.get('/status', function (req: Request, res: Response): void {
	res.status(SUCCESSFUL_REQUEST).send('OK');
});

router.get('/health', function (req: Request, res: Response): void {
	res.status(SUCCESSFUL_REQUEST).send('Healthy');
});

router.get('/error', function (req: Request, res: Response): void {
	// Simulate an error
	res.set('X-Error-Tag', 'TEST_500_ALERT').status(UNSUCCESSFUL_REQUEST).send('Internal Server Error');
});

export default router;
