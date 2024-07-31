import { StackContext } from "sst/constructs";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Function } from "sst/constructs";

export function API({ stack }: StackContext) {
	const orderPlacedFn = new Function(stack, "OrderPlacedFunction", {
		handler: "packages/functions/OrderProcess.handler",
		permissions: ["dynamodb"],
	});

	orderPlacedFn.attachPermissions(["dynamodb:PutItem"]);
	
	const definition = sfn.Chain.start(
		new tasks.LambdaInvoke(stack, "OrderPlaced", {
			lambdaFunction: orderPlacedFn,
			resultPath: "$",
			integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
			retryOnServiceExceptions: true,
			payload: sfn.TaskInput.fromObject({
				body: sfn.JsonPath.executionInput,
				token: sfn.JsonPath.taskToken,

				stateName: sfn.JsonPath.stringAt("$$.State.Name"),
			}),
		})
	)
		.next(
			new tasks.LambdaInvoke(stack, "InProcess", {
				lambdaFunction: orderPlacedFn,
				resultPath: "$",
				integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
				// payloadResponseOnly: true,
				retryOnServiceExceptions: true,
				payload: sfn.TaskInput.fromObject({
					body: sfn.JsonPath.executionInput,
					token: sfn.JsonPath.taskToken,

					stateName: sfn.JsonPath.stringAt("$$.State.Name"),
				}),
			})
		)
		.next(
			new tasks.LambdaInvoke(stack, "Packed", {
				lambdaFunction: orderPlacedFn,
				resultPath: "$",
				integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
				// payloadResponseOnly: true,
				retryOnServiceExceptions: true,
				payload: sfn.TaskInput.fromObject({
					body: sfn.JsonPath.executionInput,
					token: sfn.JsonPath.taskToken,

					stateName: sfn.JsonPath.stringAt("$$.State.Name"),
				}),
			})
		)
		.next(
			new tasks.LambdaInvoke(stack, "OnTheWay", {
				lambdaFunction: orderPlacedFn,
				resultPath: "$",
				integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
				// payloadResponseOnly: true,
				retryOnServiceExceptions: true,
				payload: sfn.TaskInput.fromObject({
					body: sfn.JsonPath.executionInput,
					token: sfn.JsonPath.taskToken,

					stateName: sfn.JsonPath.stringAt("$$.State.Name"),
				}),
			})
		)
		.next(
			new tasks.LambdaInvoke(stack, "Delivered", {
				lambdaFunction: orderPlacedFn,
				resultPath: "$",
				integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
				// payloadResponseOnly: true,
				retryOnServiceExceptions: true,
				payload: sfn.TaskInput.fromObject({
					body: sfn.JsonPath.executionInput,
					token: sfn.JsonPath.taskToken,

					stateName: sfn.JsonPath.stringAt("$$.State.Name"),
				}),
			})
		);
	const orderProcessStateMachine = new StateMachine(
		stack,
		"OrderTrackingStateMachine",
		{
			definition,
		}
	);

	stack.addOutputs({
		OrderProcessSF: orderProcessStateMachine.stateMachineArn,
	});
}
