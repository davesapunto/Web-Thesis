from flask import Flask, jsonify, request
from flask_cors import CORS
import random, copy, logging
from typing import List, Dict, Tuple
import numpy as np
import time
import statistics

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})
logging.basicConfig(level=logging.DEBUG)


@app.route("/api/user", methods=['POST'])
def handle_user():
    try:
        data = request.json
        app.logger.info(f"Parsed JSON data: {data}")
        user_data = data.get('userData')
        year_level = data.get('yearLevel')
        sem_year = data.get('semesterYear')
        available_days = data.get('availableDay')
        back_subjects = data.get('backSubjects')

        

        if user_data:
            def has_prerequisites_satisfied(subject, current_schedule, subjects):
                for sem_key, sem_subjects in subjects.items():
                    if subject in sem_subjects:
                        prereqs = sem_subjects[subject].get('prereq', [])
                        
                        if not prereqs:
                            return True
                        
                        return all(prereq in current_schedule or prereq in back_subjects for prereq in prereqs)
                return False

            sections = {k: v for k, v in user_data.items() if k.startswith(f"{year_level}_{sem_year}")}

            year_names = ['First', 'Second', 'Third', 'Fourth']
            sem_names = ['First', 'Second', 'Summer']
            year_name = year_names[int(year_level) - 1]
            sem_name = sem_names[int(sem_year) - 1]
            subject_key = f'{year_name}_Year_{sem_name}_Sem'

            subjects = {
                'First_Year_First_Sem': {
                    'UNDS111': {'units': 3, 'prereq': []},
                    'STAS111': {'units': 3, 'prereq': []},
                    'TCWD111': {'units': 3, 'prereq': []},
                    'ENGL111': {'units': 3, 'prereq': []},
                    'VRTS111': {'units': 1, 'prereq': []},
                    'FOPR111': {'units': 3, 'prereq': []},
                    'ICOM111': {'units': 3, 'prereq': []},
                    'PCAS111': {'units': 3, 'prereq': []},
                },
                'First_Year_Second_Sem': {
                    'PURC111': {'units': 3, 'prereq': ['UNDS111']},
                    'MATM111': {'units': 3, 'prereq': ['STAS111']},
                    'RIPH111': {'units': 3, 'prereq': ['TCWD111']},
                    'CRWT1111': {'units': 3, 'prereq': ['ENGL111']},
                    'VRTS112': {'units': 1, 'prereq': ['VRTS111']},
                    'INPR111': {'units': 3, 'prereq': ['FOPR111']},
                    'WBDV111': {'units': 3, 'prereq': ['ICOM111']},
                    'DLOG111': {'units': 3, 'prereq': ['PCAS111']},
                },
                'First_Year_Summer': {
                    'NSTP111': {'units': 3, 'prereq': []},
                    'NSTP112': {'units': 3, 'prereq': []},
                    'PHED111': {'units': 3, 'prereq': []},
                    'PHED112': {'units': 3, 'prereq': []},
                },
                'Second_Year_First_Sem': {
                    'PHED213': {'units': 3, 'prereq': ['PHED112']},
                    'ETIC211': {'units': 3, 'prereq': ['UNDS111']},
                    'DSAA211': {'units': 3, 'prereq': ['INPR111']},
                    'IMGT211': {'units': 3, 'prereq': ['INPR111']},
                    'WBDV112': {'units': 3, 'prereq': ['WBDV111']},
                    'DSCR211': {'units': 3, 'prereq': ['INPR111']},
                    'OOPR211': {'units': 3, 'prereq': ['INPR111']},
                    'VRTS114': {'units': 4, 'prereq': ['VRTS113']},
                    'VRTS113': {'units': 3, 'prereq': ['VRTS112']},
                },
                'Second_Year_Second_Sem': {
                    'PPGC211': {'units': 3, 'prereq': ['RIPH111']},
                    'PHED213': {'units': 3, 'prereq': ['PHED212']},
                    'LFAD211': {'units': 3, 'prereq': ['DSAA211']},
                    'ADET211': {'units': 3, 'prereq': ['DLOG111']},
                    'DBSA211': {'units': 3, 'prereq': ['IMGT211']},
                    'MADS211': {'units': 3, 'prereq': ['WBDV112']},
                    'QMET211': {'units': 3, 'prereq': ['DSCR211']},
                    'OOPR212': {'units': 3, 'prereq': ['OOPR211']},
                },
                'Third_Year_First_Sem': {
                    'SEPC311': {'units': 3, 'prereq': ['ETIC211']},
                    'ITPM311': {'units': 3, 'prereq': ['3RD YEAR STANDING']},
                    'HCIN311': {'units': 3, 'prereq': ['ADET211']},
                    'IAAS311': {'units': 2, 'prereq': ['LFAD211']},
                    'IPTC311': {'units': 3, 'prereq': ['OOPR212']},
                    'NETW311': {'units': 3, 'prereq': ['LFAD211']},
                    'SIAA311': {'units': 3, 'prereq': ['WBDV112']},
                    'SFCR311': {'units': 3, 'prereq': ['QMET211']},
                },
                'Third_Year_Second_Sem': {
                    'HCIN312': {'units': 3, 'prereq': ['HCIN311']},
                    'IAAS312': {'units': 3, 'prereq': ['IAAS311']},
                    'IPTC312': {'units': 3, 'prereq': ['IPTC311']},
                    'ITCP311': {'units': 3, 'prereq': ['ITPM311']},
                    'NETW312': {'units': 3, 'prereq': ['NETW311']},
                    'SIAA312': {'units': 3, 'prereq': ['SIAA311']},
                },
                'Fourth_Year_First_Sem': {
                    'SIAA311': {'units': 3, 'prereq': ['WBDV112']},
                    'SFCR311': {'units': 3, 'prereq': ['QMET211']},
                    'CTIC3411': {'units': 3, 'prereq': ['HCIN312']},
                    'BUSM311': {'units': 3, 'prereq': ['ITPM311']},
                    'ITCP312': {'units': 3, 'prereq': ['ITCP311']},
                    'ITEL311': {'units': 3, 'prereq': ['SIAA311']},
                    'ITEL312': {'units': 3, 'prereq': ['ITEL312']},
                    'SADM411': {'units': 3, 'prereq': []},
                    'ARTA111': {'units': 3, 'prereq': ['TCWD111']},
                    'RIZL111': {'units': 3, 'prereq': []},
                },
                'Fourth_Year_Second_Sem': {
                    'ITIM411': {'units': 9, 'prereq': ['4TH YEAR STANDING']},
                    'ITEL313': {'units': 3, 'prereq': ['ITEL4']},
                    'ITEL314': {'units': 3, 'prereq': ['ITEL313']},
                }
            }

            required_subjects = list(subjects.get(subject_key, {}).keys())
            filtered_required_subjects = [
                subject for subject in required_subjects 
                if not any(prereq in back_subjects for prereq in subjects[subject_key].get(subject, {}).get('prereq', []))
            ]
            
            def parse_schedule(schedule_str):
                parts = schedule_str.split('|')
                if len(parts) >= 1:
                    return parts[0].strip()
                else:
                    return ""

            class Particle:
                def __init__(self, dimensions):
                    self.position = [random.random() for _ in range(dimensions)]
                    self.velocity = [random.uniform(-1, 1) for _ in range(dimensions)]
                    self.best_position = copy.deepcopy(self.position)
                    self.best_score = float('-inf')

            def fitness(schedule, available_days, back_subjects, required_subjects):
                score = 0
                scheduled_subjects = set()
                days_used = {day: False for day in available_days}

                for subject, subject_data in schedule.items():
                    day = parse_schedule(subject_data['schedule'])
                    if day in available_days:
                        score += 1  # Reward for scheduling a subject
                        days_used[day] = True
                        if subject in back_subjects:
                            score += 2  # Extra reward for back subjects
                        if subject in required_subjects:
                            score += 5  # Increased reward for required subjects
                        scheduled_subjects.add(subject)
                    else:
                        score -= 2  # Penalty for scheduling on unavailable day

                # Reward for using all available days
                score += sum(days_used.values()) * 3

                # Heavy penalty for missing required subjects
                missing_subjects = set(required_subjects) - scheduled_subjects
                score -= len(missing_subjects) * 10

                return score

            def update_velocity(particle, global_best_position, w=0.5, c1=1, c2=1):
                for i in range(len(particle.position)):
                    r1, r2 = random.random(), random.random()
                    cognitive = c1 * r1 * (particle.best_position[i] - particle.position[i])
                    social = c2 * r2 * (global_best_position[i] - particle.position[i])
                    particle.velocity[i] = w * particle.velocity[i] + cognitive + social

            def update_position(particle):
                for i in range(len(particle.position)):
                    particle.position[i] += particle.velocity[i]
                    particle.position[i] = max(0, min(1, particle.position[i]))  # Clamp to [0, 1]

            def particle_swarm_optimization(sections, available_days, back_subjects, required_subjects, num_particles=2, max_iterations=5):
                dimensions = len(required_subjects)
                particles = [Particle(dimensions) for _ in range(num_particles)]
                global_best_position = None
                global_best_score = float('-inf')

                for _ in range(max_iterations):
                    for particle in particles:
                        # Convert particle position to schedule
                        schedule = {}
                        for i, subject in enumerate(required_subjects):
                            if particle.position[i] > 0.5:
                                best_section = None
                                best_section_score = float('-inf')
                                for section, subjects in sections.items():
                                    if subject in subjects:
                                        temp_schedule = copy.deepcopy(schedule)
                                        temp_schedule[subject] = {'schedule': subjects[subject], 'section': section}
                                        score = fitness(temp_schedule, available_days, back_subjects, required_subjects)
                                        if score > best_section_score:
                                            best_section_score = score
                                            best_section = section
                                if best_section:
                                    schedule[subject] = {'schedule': sections[best_section][subject], 'section': best_section}

                        score = fitness(schedule, available_days, back_subjects, required_subjects)

                        if score > particle.best_score:
                            particle.best_score = score
                            particle.best_position = copy.deepcopy(particle.position)
                        if score > global_best_score:
                            global_best_score = score
                            global_best_position = copy.deepcopy(particle.position)

                    for particle in particles:
                        update_velocity(particle, global_best_position)
                        update_position(particle)

                # Convert the best solution into a schedule
                optimized_schedule = {}
                for i, subject in enumerate(required_subjects):
                    if global_best_position[i] > 0.5:
                        best_section = None
                        best_section_score = float('-inf')
                        for section, subjects in sections.items():
                            if subject in subjects:
                                temp_schedule = copy.deepcopy(optimized_schedule)
                                temp_schedule[subject] = {'schedule': subjects[subject], 'section': section}
                                score = fitness(temp_schedule, available_days, back_subjects, required_subjects)
                                if score > best_section_score:
                                    best_section_score = score
                                    best_section = section
                        if best_section:
                            optimized_schedule[subject] = {
                                'schedule': sections[best_section][subject],
                                'section': best_section
                            }

                # Ensure all required subjects are included
                for subject in required_subjects:
                    if subject not in optimized_schedule:
                        best_section = None
                        best_section_score = float('-inf')
                        for section, subjects in sections.items():
                            if subject in subjects:
                                temp_schedule = copy.deepcopy(optimized_schedule)
                                temp_schedule[subject] = {'schedule': subjects[subject], 'section': section}
                                score = fitness(temp_schedule, available_days, back_subjects, required_subjects)
                                if score > best_section_score:
                                    best_section_score = score
                                    best_section = section
                        if best_section:
                            optimized_schedule[subject] = {
                                'schedule': sections[best_section][subject],
                                'section': best_section
                            }

                return optimized_schedule, global_best_score

            def ant_colony_optimization(sections, available_days, back_subjects, required_subjects, num_ants=2, num_iterations=5):
                all_subjects = list(required_subjects)
                num_subjects = len(all_subjects)
                pheromone = np.ones((num_subjects, num_subjects))
                best_schedule = {}
                best_score = float('-inf')

                for _ in range(num_iterations):
                    for _ in range(num_ants):
                        schedule = {}
                        available_subjects = copy.deepcopy(all_subjects)
                        
                        while available_subjects:
                            if not available_subjects:
                                break
                            subject = random.choices(available_subjects, weights=[pheromone[all_subjects.index(s)].sum() for s in available_subjects])[0]
                            best_section = None
                            best_section_score = float('-inf')

                            for section, subjects in sections.items():
                                if subject in subjects:
                                    temp_schedule = copy.deepcopy(schedule)
                                    temp_schedule[subject] = {'schedule': subjects[subject], 'section': section}
                                    score = fitness(temp_schedule, available_days, back_subjects, required_subjects)
                                    if score > best_section_score:
                                        best_section_score = score
                                        best_section = section

                            if best_section:
                                schedule[subject] = {'schedule': sections[best_section][subject], 'section': best_section}
                            available_subjects.remove(subject)

                        score = fitness(schedule, available_days, back_subjects, required_subjects)
                        if score > best_score:
                            best_score = score
                            best_schedule = copy.deepcopy(schedule)

                        # Update pheromone
                        for i, subject1 in enumerate(all_subjects):
                            for j, subject2 in enumerate(all_subjects):
                                if subject1 in schedule and subject2 in schedule:
                                    pheromone[i][j] += 1 / (1 + best_score - score)

                    # Evaporate pheromone
                    pheromone *= 0.95

                return best_schedule, best_score

            def pso_aco_hybrid(sections, available_days, back_subjects, required_subjects, num_particles=2, max_iterations=5):
                dimensions = len(required_subjects)
                particles = [Particle(dimensions) for _ in range(num_particles)]
                global_best_position = None
                global_best_score = float('-inf')

                for _ in range(max_iterations):
                    for particle in particles:
                        # Convert particle position to schedule
                        schedule = {}
                        for i, subject in enumerate(required_subjects):
                            if particle.position[i] > 0.5:
                                best_section = None
                                best_section_score = float('-inf')
                                for section, subjects in sections.items():
                                    if subject in subjects:
                                        temp_schedule = copy.deepcopy(schedule)
                                        temp_schedule[subject] = {'schedule': subjects[subject], 'section': section}
                                        score = fitness(temp_schedule, available_days, back_subjects, required_subjects)
                                        if score > best_section_score:
                                            best_section_score = score
                                            best_section = section
                                if best_section:
                                    schedule[subject] = {'schedule': sections[best_section][subject], 'section': best_section}

                        # Run ACO
                        aco_schedule, aco_score = ant_colony_optimization(sections, available_days, back_subjects, required_subjects)
                        
                        # Merge PSO and ACO results
                        merged_schedule = {**schedule, **aco_schedule}
                        score = fitness(merged_schedule, available_days, back_subjects, required_subjects)

                        if score > particle.best_score:
                            particle.best_score = score
                            particle.best_position = copy.deepcopy(particle.position)
                        if score > global_best_score:
                            global_best_score = score
                            global_best_position = copy.deepcopy(particle.position)

                    for particle in particles:
                        update_velocity(particle, global_best_position)
                        update_position(particle)

                return global_best_position, global_best_score

            def has_prerequisites_satisfied(subject, current_schedule, subjects, back_subjects, checked_subjects=None):
                if checked_subjects is None:
                    checked_subjects = set()

                if subject in checked_subjects:
                    return True

                checked_subjects.add(subject)

                # Check if the subject itself has prerequisites
                for sem_key, sem_subjects in subjects.items():
                    if subject in sem_subjects:
                        prereqs = sem_subjects[subject].get('prereq', [])
                        
                        # Check if prerequisites are satisfied
                        if not all(prereq in current_schedule or prereq in back_subjects for prereq in prereqs):
                            return False

                # Recursively check future subjects that have this subject as a prerequisite
                for sem_key, sem_subjects in subjects.items():
                    for future_subject, future_subject_details in sem_subjects.items():
                        if subject in future_subject_details.get('prereq', []):
                            # Recursively check if this future subject can be taken
                            if not has_prerequisites_satisfied(future_subject, current_schedule, subjects, back_subjects, checked_subjects):
                                return False

                return True

            def optimize_schedule(sections, available_days, back_subjects, required_subjects):
                best_solution, best_score = pso_aco_hybrid(sections, available_days, back_subjects, required_subjects)

                # Convert the best solution into a schedule
                optimized_schedule = {}
                for i, subject in enumerate(required_subjects):
                    if best_solution[i] > 0.5:
                        best_section = None
                        best_section_score = float('-inf')
                        for section, subjects in sections.items():
                            if subject in subjects:
                                temp_schedule = copy.deepcopy(optimized_schedule)
                                temp_schedule[subject] = {'schedule': subjects[subject], 'section': section}
                                score = fitness(temp_schedule, available_days, back_subjects, required_subjects)
                                if score > best_section_score:
                                    best_section_score = score
                                    best_section = section
                        if best_section:
                            optimized_schedule[subject] = {
                                'schedule': sections[best_section][subject],
                                'section': best_section
                            }

                # Ensure all required subjects are included
                for subject in required_subjects:
                    if subject not in optimized_schedule:
                        best_section = None
                        best_section_score = float('-inf')
                        for section, subjects in sections.items():
                            if subject in subjects:
                                temp_schedule = copy.deepcopy(optimized_schedule)
                                temp_schedule[subject] = {'schedule': subjects[subject], 'section': section}
                                score = fitness(temp_schedule, available_days, back_subjects, required_subjects)
                                if score > best_section_score:
                                    best_section_score = score
                                    best_section = section
                        if best_section:
                            optimized_schedule[subject] = {
                                'schedule': sections[best_section][subject],
                                'section': best_section
                            }

                return optimized_schedule

            hybrid_schedule = optimize_schedule(sections, available_days, back_subjects, filtered_required_subjects)
            hybrid_score = fitness(hybrid_schedule, available_days, back_subjects, filtered_required_subjects)

            # Run standalone PSO algorithm
            pso_schedule, pso_score = particle_swarm_optimization(sections, available_days, back_subjects, filtered_required_subjects)

            def track_algorithm_performance(sections, available_days, back_subjects, required_subjects, num_runs=25):
                performance_data = {
                    'hybrid_scores': [],
                    'pso_scores': [],
                    'hybrid_times': [],
                    'pso_times': []
                }

                for _ in range(num_runs):
                    # Hybrid algorithm performance
                    start_time = time.time()
                    hybrid_schedule = optimize_schedule(sections, available_days, back_subjects, required_subjects)
                    hybrid_time = time.time() - start_time
                    hybrid_score = fitness(hybrid_schedule, available_days, back_subjects, required_subjects)
                    
                    performance_data['hybrid_scores'].append(hybrid_score)
                    performance_data['hybrid_times'].append(hybrid_time)
                    
                    # Standalone PSO performance
                    start_time = time.time()
                    pso_schedule, pso_score = particle_swarm_optimization(sections, available_days, back_subjects, required_subjects)
                    pso_time = time.time() - start_time
                    
                    performance_data['pso_scores'].append(pso_score)
                    performance_data['pso_times'].append(pso_time)

                # Calculate performance and time statistics
                performance_stats = {
                    # Score statistics for hybrid algorithm
                    'hybrid_avg_score': statistics.mean(performance_data['hybrid_scores']),
                    'hybrid_std_dev_score': statistics.stdev(performance_data['hybrid_scores']),
                    'hybrid_min_score': min(performance_data['hybrid_scores']),
                    'hybrid_max_score': max(performance_data['hybrid_scores']),
                    
                    # Time statistics for hybrid algorithm
                    'hybrid_avg_time': statistics.mean(performance_data['hybrid_times']),
                    'hybrid_std_dev_time': statistics.stdev(performance_data['hybrid_times']),
                    'hybrid_min_time': min(performance_data['hybrid_times']),
                    'hybrid_max_time': max(performance_data['hybrid_times']),
                    
                    # Score statistics for PSO
                    'pso_avg_score': statistics.mean(performance_data['pso_scores']),
                    'pso_std_dev_score': statistics.stdev(performance_data['pso_scores']),
                    'pso_min_score': min(performance_data['pso_scores']),
                    'pso_max_score': max(performance_data['pso_scores']),
                    
                    # Time statistics for PSO
                    'pso_avg_time': statistics.mean(performance_data['pso_times']),
                    'pso_std_dev_time': statistics.stdev(performance_data['pso_times']),
                    'pso_min_time': min(performance_data['pso_times']),
                    'pso_max_time': max(performance_data['pso_times'])
                }

                return performance_stats, performance_data
            
            performance_stats, performance_details = track_algorithm_performance(
                sections, 
                available_days, 
                back_subjects, 
                filtered_required_subjects
            )

            print(performance_stats, performance_details)

            return jsonify({
                "message": "Schedules optimized successfully",
                "hybridSchedule": hybrid_schedule,
                "hybridScore": hybrid_score,
                "psoSchedule": pso_schedule,
                "psoScore": pso_score
            })
        
    except Exception as e:
        app.logger.error(f"Error processing request: {str(e)}")
        return jsonify({"message": f"Server error: {str(e)}", "status": "error"}), 500

if __name__ == "__main__":
    app.run(debug=True, host='127.0.0.1', port=5000)