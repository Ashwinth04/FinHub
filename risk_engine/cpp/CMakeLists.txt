cmake_minimum_required(VERSION 3.12)
project(risk_engine)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(pybind11 REQUIRED)
find_package(OpenMP REQUIRED)

# Add compiler flags for optimization and OpenMP
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -march=native")
if(OpenMP_CXX_FOUND)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${OpenMP_CXX_FLAGS}")
endif()

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR})

# Create pybind11 module
pybind11_add_module(risk_engine_cpp 
    montecarlo.cpp
    bindings.cpp
)

# Link OpenMP
if(OpenMP_CXX_FOUND)
    target_link_libraries(risk_engine_cpp PRIVATE OpenMP::OpenMP_CXX)
endif()

# Compiler-specific properties
target_compile_definitions(risk_engine_cpp PRIVATE VERSION_INFO=${EXAMPLE_VERSION_INFO})

# Set properties for the module
set_target_properties(risk_engine_cpp PROPERTIES
    CXX_VISIBILITY_PRESET "hidden"
    INTERPROCEDURAL_OPTIMIZATION TRUE
)

# Platform-specific settings
if(MSVC)
    target_compile_options(risk_engine_cpp PRIVATE /bigobj)
endif()

# Enable position independent code
set_target_properties(risk_engine_cpp PROPERTIES POSITION_INDEPENDENT_CODE ON)