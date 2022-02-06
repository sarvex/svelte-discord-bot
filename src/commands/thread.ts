import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { has_any_role_or_id } from '../utils/snowflake.js';
import { build_embed } from '../utils/embed_helpers.js';
import { THREAD_ADMIN_IDS } from '../config.js';
import { command } from 'jellycommands';

export default command({
	name: 'thread',
	description: 'Manage a thread',

	options: [
		{
			name: 'archive',
			description: 'Archive a thread',
			type: ApplicationCommandOptionTypes['SUB_COMMAND'],
		},
		{
			name: 'rename',
			description: 'Rename a thread',
			type: ApplicationCommandOptionTypes['SUB_COMMAND'],

			options: [
				{
					name: 'name',
					description: 'The new name of the thread',
					type: ApplicationCommandOptionTypes['STRING'],
					required: true,
				},
			],
		},
	],

	global: true,
	defer: true,
	dev: true,

	run: async ({ interaction }) => {
		const subcommand = interaction.options.getSubcommand(true);
		const thread = await interaction.channel?.fetch();

		const member = await interaction.guild?.members.fetch(
			interaction.user.id,
		);

		if (!member)
			return void interaction.followUp({
				content: 'Unable to find you',
				ephemeral: true,
			});

		if (!thread?.isThread())
			return void interaction.followUp({
				content: 'This channel is not a thread',
				ephemeral: true,
			});

		const allowed_ids = [...THREAD_ADMIN_IDS];

		// We assume this thread was auto threadded so the thread owner is the person who sent the start message
		const start_message = await thread.fetchStarterMessage();
		if (start_message) allowed_ids.push(start_message.author.id);

		// Thread owners can also archive/rename threads
		const thread_owner = await thread.fetchOwner();
		if (thread_owner) allowed_ids.push(thread_owner.id);

		if (!has_any_role_or_id(member, allowed_ids))
			return void interaction.followUp({
				content: "You don't have the permissions to manage this thread",
				ephemeral: true,
			});

		switch (subcommand) {
			case 'archive':
				await thread.setArchived(true);

				interaction.followUp({
					embeds: [
						build_embed({
							description: 'Thread archived',
						}),
					],
				});
				break;

			case 'rename':
				const newName = interaction.options.getString('name', true);
				await thread.setName(newName);

				interaction.followUp({
					embeds: [
						build_embed({
							description: `Thread renamed to ${newName}`,
						}),
					],
				});
				break;
		}
	},
});