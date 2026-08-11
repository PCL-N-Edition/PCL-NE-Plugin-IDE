using PCL.N.Plugin;

namespace HelloPcl;

/// <summary>
/// Community Edition Hello PCL fixture entry point (PCL N Plugin SDK).
/// </summary>
public sealed class HelloPlugin : IPclNPlugin
{
	public ValueTask InitializeAsync(IPluginContext context, CancellationToken cancellationToken)
	{
		cancellationToken.ThrowIfCancellationRequested();
		IPluginCommandService commands = context.Services.Require<IPluginCommandService>();
		context.Lifetime.Track(commands.Register(new PluginCommandDescriptor(
			"com.pcln.hello-pcl.say-hello",
			"Say hello",
			_ =>
			{
				context.Logger.Info("Hello from the Community Edition fixture plugin.");
				return Task.CompletedTask;
			})));

		return ValueTask.CompletedTask;
	}

	public ValueTask ShutdownAsync(CancellationToken cancellationToken) => ValueTask.CompletedTask;
}
