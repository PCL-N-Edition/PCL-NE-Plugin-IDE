namespace HelloPcl;

/// <summary>
/// Minimal fixture plugin entry used by Community Edition M1 e2e tests.
/// </summary>
public sealed class PluginEntry
{
	public string Id => "com.pcln.hello-pcl";
	public string Name => "Hello PCL";

	public void OnLoad()
	{
	}
}
