require 'xcodeproj'
# install if not exist with
# sudo gem install xcodeproj

# Function to add files and directories to the default "Copy Bundle Resources" phase
def add_bundle_resources(project, target, base_path)
  bundle_resources_build_phase = target.resources_build_phase

  # Traverse through each item in the base path
  Dir.glob(File.join(base_path, '*')).each do |path|
    if File.file?(path)
      # If it's a file, add it to the resources build phase
      file_reference = project.new_file(path)
      bundle_resources_build_phase.add_file_reference(file_reference, true)
    elsif File.directory?(path)
      # If it's a directory, add it as a folder reference to the resources build phase
      folder_reference = project.main_group.new_reference(path)
      bundle_resources_build_phase.add_file_reference(folder_reference, true)
    else
      raise "Path #{path} is neither a file nor a directory."
    end
  end
end

# Path to your Xcode project file
project_path = 'Proton Pass.xcodeproj'

# Open the Xcode project
project = Xcodeproj::Project.open(project_path)

# Find the target by name ("Safari extension")
safari_extension_target = project.targets.find { |target| target.name == 'Safari Extension' }
unless safari_extension_target
  raise "Target 'Safari Extension' not found in the Xcode project."
end

# Construct the base directory path relative to the script's directory
base_directory_path = "../dist"

# Add bundle resources to the default "Copy Bundle Resources" phase for Safari extension target
add_bundle_resources(project, safari_extension_target, base_directory_path)

# Save the changes back to the Xcode project file
project.save
